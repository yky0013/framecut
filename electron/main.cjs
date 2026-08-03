const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  utilityProcess,
} = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { randomUUID } = require('crypto')
const fs = require('fs')

let mainWindow
let activeExport = null
let exportWasCanceled = false
let activeTranscription = null

function getFfmpegPath() {
  const binaryPath = require('ffmpeg-static')
  return app.isPackaged
    ? binaryPath.replace('app.asar', 'app.asar.unpacked')
    : binaryPath
}

function getBundledModelsPath() {
  const modelPath = path.join(__dirname, '..', 'models')
  return app.isPackaged
    ? modelPath.replace('app.asar', 'app.asar.unpacked')
    : modelPath
}

function formatSrtTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const milliseconds = Math.round((safe % 1) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

function createTrimmedSrt(subtitles, trimStart, trimEnd) {
  return subtitles
    .filter((subtitle) => subtitle.text?.trim() && subtitle.end > trimStart && subtitle.start < trimEnd)
    .sort((a, b) => a.start - b.start)
    .map((subtitle, index) => {
      const start = Math.max(subtitle.start, trimStart) - trimStart
      const end = Math.min(subtitle.end, trimEnd) - trimStart
      return `${index + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${subtitle.text.trim()}`
    })
    .join('\n\n')
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0))
}

function cleanFilterNumber(value) {
  return Number(value.toFixed(4))
}

function createEffectFilters(effectId, intensityValue) {
  const intensity = clampNumber(intensityValue, 0, 100) / 100
  if (effectId === 'original' || intensity <= 0) return []

  const eq = (brightness, contrast, saturation) => (
    `eq=brightness=${cleanFilterNumber(brightness * intensity)}`
    + `:contrast=${cleanFilterNumber(1 + (contrast - 1) * intensity)}`
    + `:saturation=${cleanFilterNumber(1 + (saturation - 1) * intensity)}`
  )

  switch (effectId) {
    case 'cinematic':
      return [
        eq(-0.045, 1.18, 0.88),
        `colorbalance=rs=${cleanFilterNumber(-0.025 * intensity)}:bs=${cleanFilterNumber(0.07 * intensity)}`,
      ]
    case 'vivid':
      return [eq(0.025, 1.1, 1.5)]
    case 'warm':
      return [
        eq(0.035, 1.06, 1.17),
        `colorbalance=rs=${cleanFilterNumber(0.1 * intensity)}:gs=${cleanFilterNumber(0.025 * intensity)}:bs=${cleanFilterNumber(-0.08 * intensity)}`,
      ]
    case 'cool':
      return [
        eq(0, 1.1, 1.08),
        `colorbalance=rs=${cleanFilterNumber(-0.07 * intensity)}:gs=${cleanFilterNumber(0.02 * intensity)}:bs=${cleanFilterNumber(0.11 * intensity)}`,
      ]
    case 'noir':
      return [
        `hue=s=${cleanFilterNumber(1 - intensity)}`,
        eq(-0.035, 1.28, 1),
      ]
    case 'vintage':
      return [
        eq(0.015, 0.94, 0.82),
        `colorbalance=rs=${cleanFilterNumber(0.12 * intensity)}:gs=${cleanFilterNumber(0.045 * intensity)}:bs=${cleanFilterNumber(-0.1 * intensity)}`,
      ]
    default:
      return []
  }
}

function getSubtitleForceStyle(subtitleStyleId) {
  const base = 'FontName=Microsoft YaHei,Alignment=2,Shadow=0,MarginV=28'
  const styles = {
    classic: `${base},FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=1,Outline=2`,
    yellow: `${base},FontSize=22,PrimaryColour=&H005FE3FF,OutlineColour=&H90000000,BorderStyle=1,Outline=3`,
    cyan: `${base},FontSize=21,PrimaryColour=&H00F2FF61,OutlineColour=&HB0000000,BorderStyle=1,Outline=2`,
    cinema: `${base},FontSize=20,PrimaryColour=&H00FFFFFF,BackColour=&H70000000,OutlineColour=&H70000000,BorderStyle=3,Outline=5`,
  }
  return styles[subtitleStyleId] || styles.classic
}

function safeUnlink(filePath) {
  if (!filePath) return
  fs.promises.unlink(filePath).catch(() => {})
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1040,
    minHeight: 720,
    backgroundColor: '#0b0b0c',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0b0b0c',
      symbolColor: '#a9a9ad',
      height: 42,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (process.argv.includes('--dev')) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('export-video', async (event, options) => {
  if (activeExport) {
    return { ok: false, error: '已有导出任务正在进行。' }
  }

  const {
    inputPath,
    startTime,
    endTime,
    suggestedName,
    subtitles = [],
    effectId = 'original',
    effectIntensity = 100,
    fadeIn = 0,
    fadeOut = 0,
    subtitleStyleId = 'classic',
  } = options

  if (!inputPath || !fs.existsSync(inputPath)) {
    return { ok: false, error: '找不到源视频，请重新导入。' }
  }

  const duration = Number(endTime) - Number(startTime)
  if (!Number.isFinite(duration) || duration <= 0.05) {
    return { ok: false, error: '裁剪区间过短，请至少保留 0.05 秒。' }
  }

  const saveResult = await dialog.showSaveDialog(mainWindow, {
    title: '导出视频',
    defaultPath: suggestedName || 'FrameCut-export.mp4',
    filters: [{ name: 'MP4 视频', extensions: ['mp4'] }],
  })

  if (saveResult.canceled || !saveResult.filePath) {
    return { ok: false, canceled: true }
  }

  const outputPath = saveResult.filePath.toLowerCase().endsWith('.mp4')
    ? saveResult.filePath
    : `${saveResult.filePath}.mp4`

  const ffmpegPath = getFfmpegPath()
  const subtitleContent = createTrimmedSrt(subtitles, Number(startTime), Number(endTime))
  const subtitlePath = subtitleContent
    ? path.join(app.getPath('temp'), `framecut-${randomUUID()}.srt`)
    : null

  if (subtitlePath) {
    await fs.promises.writeFile(subtitlePath, subtitleContent, 'utf8')
  }

  const args = [
    '-hide_banner',
    '-y',
    '-ss',
    String(startTime),
    '-i',
    inputPath,
    '-t',
    String(duration),
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
  ]

  const videoFilters = createEffectFilters(effectId, effectIntensity)

  if (subtitlePath) {
    const subtitleName = path.basename(subtitlePath).replace(/'/g, "\\'")
    videoFilters.push(
      `subtitles='${subtitleName}':charenc=UTF-8:force_style='${getSubtitleForceStyle(subtitleStyleId)}'`,
    )
  }

  const safeFadeIn = Math.min(clampNumber(fadeIn, 0, 3), duration / 2)
  const safeFadeOut = Math.min(clampNumber(fadeOut, 0, 3), duration / 2)
  if (safeFadeIn > 0.01) {
    videoFilters.push(`fade=t=in:st=0:d=${cleanFilterNumber(safeFadeIn)}`)
  }
  if (safeFadeOut > 0.01) {
    videoFilters.push(
      `fade=t=out:st=${cleanFilterNumber(Math.max(0, duration - safeFadeOut))}:d=${cleanFilterNumber(safeFadeOut)}`,
    )
  }

  if (videoFilters.length > 0) {
    args.push('-vf', videoFilters.join(','))
  }

  args.push(
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    '-progress',
    'pipe:1',
    '-nostats',
    outputPath,
  )

  return new Promise((resolve) => {
    let errorLog = ''
    exportWasCanceled = false
    activeExport = spawn(ffmpegPath, args, {
      cwd: app.getPath('temp'),
      windowsHide: true,
    })

    activeExport.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split(/\r?\n/)
      for (const line of lines) {
        const [key, value] = line.split('=')
        if (key === 'out_time_us') {
          const processed = Number(value) / 1_000_000
          const progress = Math.min(100, Math.max(0, (processed / duration) * 100))
          event.sender.send('export-progress', progress)
        }
      }
    })

    activeExport.stderr.on('data', (chunk) => {
      errorLog += chunk.toString()
      if (errorLog.length > 12000) errorLog = errorLog.slice(-12000)
    })

    activeExport.on('error', (error) => {
      activeExport = null
      safeUnlink(subtitlePath)
      resolve({ ok: false, error: `无法启动导出引擎：${error.message}` })
    })

    activeExport.on('close', (code) => {
      activeExport = null
      safeUnlink(subtitlePath)
      if (exportWasCanceled) {
        exportWasCanceled = false
        resolve({ ok: false, canceled: true })
      } else if (code === 0) {
        event.sender.send('export-progress', 100)
        resolve({ ok: true, outputPath })
      } else {
        resolve({
          ok: false,
          error: `导出失败（代码 ${code}）。${errorLog.trim().slice(-500)}`,
        })
      }
    })
  })
})

ipcMain.handle('cancel-export', async () => {
  if (!activeExport) return { ok: false }
  exportWasCanceled = true
  activeExport.kill()
  return { ok: true }
})

ipcMain.handle('save-subtitle-file', async (_event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出 SRT 字幕',
    defaultPath: options.suggestedName || 'FrameCut-subtitles.srt',
    filters: [{ name: 'SRT 字幕', extensions: ['srt'] }],
  })

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true }
  }

  const outputPath = result.filePath.toLowerCase().endsWith('.srt')
    ? result.filePath
    : `${result.filePath}.srt`
  await fs.promises.writeFile(outputPath, `\uFEFF${options.content}`, 'utf8')
  return { ok: true, outputPath }
})

function extractAudio(event, options, audioPath) {
  const duration = Number(options.endTime) - Number(options.startTime)
  const args = [
    '-hide_banner',
    '-y',
    '-ss',
    String(options.startTime),
    '-i',
    options.inputPath,
    '-t',
    String(duration),
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-f',
    'f32le',
    '-progress',
    'pipe:1',
    '-nostats',
    audioPath,
  ]

  return new Promise((resolve) => {
    let errorLog = ''
    const ffmpeg = spawn(getFfmpegPath(), args, { windowsHide: true })
    activeTranscription.ffmpeg = ffmpeg

    ffmpeg.stdout.on('data', (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        const [key, value] = line.split('=')
        if (key === 'out_time_us') {
          const processed = Number(value) / 1_000_000
          const progress = Math.min(12, Math.max(0, (processed / duration) * 12))
          event.sender.send('transcription-progress', {
            stage: 'extracting',
            progress,
            message: '正在提取语音…',
          })
        }
      }
    })

    ffmpeg.stderr.on('data', (chunk) => {
      errorLog += chunk.toString()
      if (errorLog.length > 8000) errorLog = errorLog.slice(-8000)
    })

    ffmpeg.on('error', (error) => {
      resolve({ ok: false, error: `无法提取音频：${error.message}` })
    })

    ffmpeg.on('close', (code) => {
      if (activeTranscription?.canceled) {
        resolve({ ok: false, canceled: true })
      } else if (code === 0) {
        resolve({ ok: true })
      } else {
        resolve({
          ok: false,
          error: `音频提取失败（代码 ${code}）。${errorLog.trim().slice(-400)}`,
        })
      }
    })
  })
}

function runWhisper(event, options, audioPath) {
  return new Promise((resolve) => {
    const workerPath = path.join(__dirname, 'transcribe-worker.cjs')
    const child = utilityProcess.fork(workerPath, [], {
      serviceName: 'FrameCut Whisper',
      stdio: 'pipe',
    })
    activeTranscription.child = child
    let settled = false
    let errorLog = ''

    child.stderr?.on('data', (chunk) => {
      errorLog += chunk.toString()
      if (errorLog.length > 8000) errorLog = errorLog.slice(-8000)
    })

    child.on('message', (message) => {
      if (message.type === 'progress') {
        event.sender.send('transcription-progress', message.payload)
      } else if (message.type === 'result') {
        settled = true
        resolve({ ok: true, subtitles: message.subtitles })
        child.kill()
      } else if (message.type === 'error') {
        settled = true
        resolve({ ok: false, error: message.error })
        child.kill()
      }
    })

    child.on('spawn', () => {
      child.postMessage({
        type: 'transcribe',
        audioPath,
        bundledModelsPath: getBundledModelsPath(),
        language: options.language || 'auto',
        model: 'onnx-community/whisper-base',
      })
    })

    child.on('exit', (code) => {
      if (settled) return
      if (activeTranscription?.canceled) {
        resolve({ ok: false, canceled: true })
      } else {
        resolve({
          ok: false,
          error: `语音识别进程异常退出（代码 ${code}）。${errorLog.trim().slice(-400)}`,
        })
      }
    })
  })
}

ipcMain.handle('transcribe-video', async (event, options) => {
  if (activeTranscription) {
    return { ok: false, error: '已有语音识别任务正在进行。' }
  }
  if (!options.inputPath || !fs.existsSync(options.inputPath)) {
    return { ok: false, error: '找不到源视频，请重新导入。' }
  }

  const duration = Number(options.endTime) - Number(options.startTime)
  if (!Number.isFinite(duration) || duration <= 0.2) {
    return { ok: false, error: '识别区间过短，请至少选择 0.2 秒。' }
  }

  const audioPath = path.join(app.getPath('temp'), `framecut-audio-${randomUUID()}.f32`)
  activeTranscription = {
    audioPath,
    canceled: false,
    ffmpeg: null,
    child: null,
  }

  event.sender.send('transcription-progress', {
    stage: 'extracting',
    progress: 0,
    message: '正在提取语音…',
  })

  try {
    const extraction = await extractAudio(event, options, audioPath)
    if (!extraction.ok) return extraction
    if (activeTranscription?.canceled) return { ok: false, canceled: true }
    const result = await runWhisper(event, options, audioPath)
    if (result.ok) {
      event.sender.send('transcription-progress', {
        stage: 'done',
        progress: 100,
        message: '字幕生成完成',
      })
    }
    return result
  } finally {
    safeUnlink(audioPath)
    activeTranscription = null
  }
})

ipcMain.handle('cancel-transcription', async () => {
  if (!activeTranscription) return { ok: false }
  activeTranscription.canceled = true
  activeTranscription.ffmpeg?.kill()
  activeTranscription.child?.kill()
  return { ok: true }
})

ipcMain.handle('show-in-folder', async (_event, filePath) => {
  if (filePath) shell.showItemInFolder(filePath)
})
