const fs = require('fs')

function send(message) {
  process.parentPort.postMessage(message)
}

process.parentPort.on('message', async (event) => {
  if (event.data?.type !== 'transcribe') return

  const {
    audioPath,
    bundledModelsPath,
    language,
    model,
  } = event.data

  try {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.localModelPath = `${bundledModelsPath}/`
    env.allowLocalModels = true
    env.allowRemoteModels = false

    send({
      type: 'progress',
      payload: {
        stage: 'model',
        progress: 12,
        message: '正在加载本地 Whisper 模型…',
      },
    })

    const recognizer = await pipeline('automatic-speech-recognition', model, {
      dtype: 'q8',
      device: 'cpu',
      progress_callback: (progress) => {
        const value = Number(progress.progress)
        send({
          type: 'progress',
          payload: {
            stage: 'model',
            progress: Number.isFinite(value) ? 12 + value * 0.48 : 24,
            message: '正在加载安装包内的 Whisper 模型…',
          },
        })
      },
    })

    const buffer = fs.readFileSync(audioPath)
    const audioView = new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      Math.floor(buffer.byteLength / Float32Array.BYTES_PER_ELEMENT),
    )
    const audio = new Float32Array(audioView)

    send({
      type: 'progress',
      payload: {
        stage: 'recognizing',
        progress: 64,
        message: '正在识别语音并生成时间轴…',
      },
    })

    const settings = {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      task: 'transcribe',
    }
    if (language && language !== 'auto') settings.language = language

    const output = await recognizer(audio, settings)
    const chunks = Array.isArray(output.chunks) ? output.chunks : []
    const subtitles = chunks
      .map((chunk, index) => {
        const start = Number(chunk.timestamp?.[0])
        const rawEnd = Number(chunk.timestamp?.[1])
        const end = Number.isFinite(rawEnd) ? rawEnd : start + 3
        return {
          id: `ai-${Date.now()}-${index}`,
          start: Number.isFinite(start) ? Math.max(0, start) : index * 3,
          end: Math.max(Number.isFinite(start) ? start + 0.2 : 0.2, end),
          text: String(chunk.text || '').trim(),
          source: 'ai',
        }
      })
      .filter((subtitle) => subtitle.text)

    if (subtitles.length === 0 && String(output.text || '').trim()) {
      subtitles.push({
        id: `ai-${Date.now()}-0`,
        start: 0,
        end: Math.max(1, audio.length / 16000),
        text: String(output.text).trim(),
        source: 'ai',
      })
    }

    send({ type: 'result', subtitles })
    await recognizer.dispose?.()
  } catch (error) {
    send({
      type: 'error',
      error: `语音识别失败：${error?.message || String(error)}`,
    })
  }
})
