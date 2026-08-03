import fs from 'node:fs'
import { pipeline, env } from '@huggingface/transformers'

const [audioPath, modelsPath] = process.argv.slice(2)
if (!audioPath || !modelsPath) {
  throw new Error('Usage: node transcribe-smoke.mjs <raw-f32le-audio> <models-path>')
}

env.localModelPath = `${modelsPath}/`
env.allowLocalModels = true
env.allowRemoteModels = false

const recognizer = await pipeline(
  'automatic-speech-recognition',
  'onnx-community/whisper-base',
  {
    dtype: 'q8',
    device: 'cpu',
    progress_callback: (progress) => {
      if (progress.status === 'progress') {
        process.stdout.write(`model ${Math.round(progress.progress || 0)}%\n`)
      }
    },
  },
)

const buffer = fs.readFileSync(audioPath)
const audioView = new Float32Array(
  buffer.buffer,
  buffer.byteOffset,
  Math.floor(buffer.byteLength / Float32Array.BYTES_PER_ELEMENT),
)

const result = await recognizer(new Float32Array(audioView), {
  return_timestamps: true,
  chunk_length_s: 30,
  stride_length_s: 5,
  task: 'transcribe',
  language: 'en',
})

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
await recognizer.dispose?.()
