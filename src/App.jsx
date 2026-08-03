import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Captions,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Clock3,
  Download,
  Film,
  FolderOpen,
  Gauge,
  HelpCircle,
  Info,
  LayoutTemplate,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Settings2,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from 'lucide-react'
import EffectsPanel from './EffectsPanel'
import SubtitlePanel from './SubtitlePanel'
import TemplatesPanel from './TemplatesPanel'
import TutorialModal from './TutorialModal'
import {
  getCssFilter,
  getEffectPreset,
  getFadeOpacity,
  getSubtitleStyle,
  getTemplate,
} from './looks'
import {
  createSubtitleId,
  parseSrt,
  serializeSrt,
} from './subtitles'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function formatTime(seconds, precise = false) {
  if (!Number.isFinite(seconds)) return precise ? '00:00.000' : '00:00'
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const milliseconds = Math.floor((safe % 1) * 1000)
  const prefix = hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''
  const base = `${prefix}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return precise ? `${base}.${String(milliseconds).padStart(3, '0')}` : base
}

function getExportName(name) {
  const clean = name.replace(/\.[^.]+$/, '')
  return `${clean || 'FrameCut'}-cut.mp4`
}

export default function App() {
  const inputRef = useRef(null)
  const subtitleInputRef = useRef(null)
  const videoRef = useRef(null)
  const [media, setMedia] = useState(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isDragging, setIsDragging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportResult, setExportResult] = useState(null)
  const [notice, setNotice] = useState(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [inspectorTab, setInspectorTab] = useState('export')
  const [subtitles, setSubtitles] = useState([])
  const [effectId, setEffectId] = useState('original')
  const [effectIntensity, setEffectIntensity] = useState(100)
  const [fadeIn, setFadeIn] = useState(0)
  const [fadeOut, setFadeOut] = useState(0)
  const [subtitleStyleId, setSubtitleStyleId] = useState('classic')
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('auto')
  const [transcribing, setTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState({
    stage: 'idle',
    progress: 0,
    message: '',
  })

  const clipDuration = Math.max(0, trimEnd - trimStart)
  const startPercent = duration ? (trimStart / duration) * 100 : 0
  const endPercent = duration ? (trimEnd / duration) * 100 : 100
  const playheadPercent = duration ? (currentTime / duration) * 100 : 0
  const activeSubtitle = useMemo(
    () => subtitles.find((subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end),
    [subtitles, currentTime],
  )
  const activeEffect = getEffectPreset(effectId)
  const activeSubtitleStyle = getSubtitleStyle(subtitleStyleId)
  const activeTemplate = getTemplate(activeTemplateId)
  const previewFilter = getCssFilter(effectId, effectIntensity)
  const previewOpacity = media
    ? getFadeOpacity(currentTime, trimStart, trimEnd, fadeIn, fadeOut)
    : 1

  const stats = useMemo(() => {
    if (!media) return null
    const sourceSize = media.file.size / (1024 * 1024)
    const ratio = duration > 0 ? clipDuration / duration : 0
    return {
      sourceSize,
      estimatedSize: Math.max(0.1, sourceSize * ratio * 0.85),
    }
  }, [media, duration, clipDuration])

  useEffect(() => {
    if (!window.framecut?.onExportProgress) return undefined
    return window.framecut.onExportProgress(setExportProgress)
  }, [])

  useEffect(() => {
    if (!window.framecut?.onTranscriptionProgress) return undefined
    return window.framecut.onTranscriptionProgress(setTranscriptionProgress)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.muted = isMuted
  }, [volume, isMuted])

  useEffect(() => {
    function handleKeyDown(event) {
      if (!media || event.target instanceof HTMLInputElement) return
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlayback()
      } else if (event.key.toLowerCase() === 'i') {
        setInPoint()
      } else if (event.key.toLowerCase() === 'o') {
        setOutPoint()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  useEffect(() => {
    return () => {
      if (media?.url) URL.revokeObjectURL(media.url)
    }
  }, [media])

  function showNotice(message, type = 'info') {
    setNotice({ message, type })
    window.setTimeout(() => setNotice(null), 3600)
  }

  function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      showNotice('请选择视频文件。', 'error')
      return
    }

    if (media?.url) URL.revokeObjectURL(media.url)
    const url = URL.createObjectURL(file)
    let filePath = ''
    try {
      filePath = window.framecut?.getFilePath(file) || ''
    } catch {
      filePath = ''
    }

    setMedia({ file, url, path: filePath })
    setDuration(0)
    setCurrentTime(0)
    setTrimStart(0)
    setTrimEnd(0)
    setSubtitles([])
    setEffectId('original')
    setEffectIntensity(100)
    setFadeIn(0)
    setFadeOut(0)
    setSubtitleStyleId('classic')
    setActiveTemplateId(null)
    setExportResult(null)
    setExportProgress(0)
  }

  function handleLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
    setTrimStart(0)
    setTrimEnd(video.duration)
    setCurrentTime(0)
  }

  function updateTime() {
    const video = videoRef.current
    if (!video || isDragging) return
    if (video.currentTime >= trimEnd && trimEnd > trimStart) {
      video.pause()
      video.currentTime = trimStart
      setCurrentTime(trimStart)
      setIsPlaying(false)
      return
    }
    setCurrentTime(video.currentTime)
  }

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart
      }
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  function seekTo(value) {
    const next = clamp(Number(value), 0, duration)
    setCurrentTime(next)
    if (videoRef.current) videoRef.current.currentTime = next
  }

  function updateTrimStart(value) {
    const next = clamp(Number(value), 0, Math.max(0, trimEnd - 0.05))
    setTrimStart(next)
    seekTo(next)
  }

  function updateTrimEnd(value) {
    const next = clamp(Number(value), Math.min(duration, trimStart + 0.05), duration)
    setTrimEnd(next)
    seekTo(next)
  }

  function setInPoint() {
    if (!media) return
    updateTrimStart(Math.min(currentTime, trimEnd - 0.05))
    showNotice(`入点已设为 ${formatTime(currentTime, true)}`)
  }

  function setOutPoint() {
    if (!media) return
    updateTrimEnd(Math.max(currentTime, trimStart + 0.05))
    showNotice(`出点已设为 ${formatTime(currentTime, true)}`)
  }

  function resetTrim() {
    setTrimStart(0)
    setTrimEnd(duration)
    seekTo(0)
  }

  async function exportClip() {
    if (!media || exporting) return
    if (!media.path) {
      showNotice('当前环境无法读取文件路径，请在桌面应用中运行。', 'error')
      return
    }
    if (!window.framecut?.exportVideo) {
      showNotice('导出功能仅在 FrameCut 桌面应用内可用。', 'error')
      return
    }

    setExporting(true)
    setExportProgress(0)
    setExportResult(null)
    const result = await window.framecut.exportVideo({
      inputPath: media.path,
      startTime: trimStart,
      endTime: trimEnd,
      suggestedName: getExportName(media.file.name),
      subtitles,
      effectId,
      effectIntensity,
      fadeIn,
      fadeOut,
      subtitleStyleId,
    })
    setExporting(false)

    if (result.ok) {
      setExportResult(result.outputPath)
      showNotice('视频导出完成。', 'success')
    } else if (!result.canceled) {
      showNotice(result.error || '导出失败，请重试。', 'error')
    }
  }

  async function cancelExport() {
    await window.framecut?.cancelExport()
    setExporting(false)
    setExportProgress(0)
    showNotice('已取消导出。')
  }

  function addSubtitle() {
    if (!media) return
    const start = clamp(currentTime, 0, Math.max(0, duration - 0.1))
    const end = clamp(start + 3, start + 0.1, duration)
    const subtitle = {
      id: createSubtitleId(),
      start,
      end,
      text: '输入字幕',
      source: 'manual',
    }
    setSubtitles((items) => [...items, subtitle].sort((a, b) => a.start - b.start))
    setInspectorTab('subtitles')
  }

  function updateSubtitle(id, patch) {
    setSubtitles((items) => items
      .map((subtitle) => {
        if (subtitle.id !== id) return subtitle
        const next = { ...subtitle, ...patch }
        return {
          ...next,
          start: clamp(Number(next.start) || 0, 0, duration),
          end: clamp(Number(next.end) || 0.1, 0.1, duration),
        }
      })
      .sort((a, b) => a.start - b.start))
  }

  function deleteSubtitle(id) {
    setSubtitles((items) => items.filter((subtitle) => subtitle.id !== id))
  }

  function changeEffect(nextEffectId) {
    setEffectId(nextEffectId)
    setActiveTemplateId(null)
  }

  function changeEffectIntensity(value) {
    setEffectIntensity(clamp(Number(value), 0, 100))
    setActiveTemplateId(null)
  }

  function changeFadeIn(value) {
    setFadeIn(clamp(Number(value) || 0, 0, 3))
    setActiveTemplateId(null)
  }

  function changeFadeOut(value) {
    setFadeOut(clamp(Number(value) || 0, 0, 3))
    setActiveTemplateId(null)
  }

  function changeSubtitleStyle(nextStyleId) {
    setSubtitleStyleId(nextStyleId)
    setActiveTemplateId(null)
  }

  function resetLook() {
    setEffectId('original')
    setEffectIntensity(100)
    setFadeIn(0)
    setFadeOut(0)
    setSubtitleStyleId('classic')
    setActiveTemplateId(null)
    showNotice('已恢复默认外观。')
  }

  function applyTemplate(template) {
    setEffectId(template.effectId)
    setEffectIntensity(template.intensity)
    setFadeIn(template.fadeIn)
    setFadeOut(template.fadeOut)
    setSubtitleStyleId(template.subtitleStyleId)
    setActiveTemplateId(template.id)
    showNotice(`已应用“${template.name}”模板。`, 'success')
  }

  async function importSubtitles(file) {
    if (!file) return
    try {
      const imported = parseSrt(await file.text())
      if (imported.length === 0) {
        showNotice('没有在文件中识别到有效的 SRT 字幕。', 'error')
        return
      }
      setSubtitles(imported)
      setInspectorTab('subtitles')
      showNotice(`已导入 ${imported.length} 条字幕。`, 'success')
    } catch (error) {
      showNotice(`字幕导入失败：${error.message}`, 'error')
    } finally {
      if (subtitleInputRef.current) subtitleInputRef.current.value = ''
    }
  }

  async function exportSubtitles() {
    if (subtitles.length === 0) return
    const baseName = media?.file.name.replace(/\.[^.]+$/, '') || 'FrameCut'
    const result = await window.framecut?.saveSubtitleFile({
      suggestedName: `${baseName}-subtitles.srt`,
      content: serializeSrt(subtitles),
    })
    if (result?.ok) showNotice('SRT 字幕已导出。', 'success')
    else if (!result?.canceled) showNotice(result?.error || '字幕导出失败。', 'error')
  }

  async function transcribeMedia() {
    if (!media || transcribing) return
    if (!media.path || !window.framecut?.transcribeVideo) {
      showNotice('语音识别仅在 FrameCut 桌面应用内可用。', 'error')
      return
    }

    setTranscribing(true)
    setTranscriptionProgress({
      stage: 'extracting',
      progress: 0,
      message: '正在提取语音…',
    })

    const result = await window.framecut.transcribeVideo({
      inputPath: media.path,
      startTime: trimStart,
      endTime: trimEnd,
      language: transcriptionLanguage,
    })
    setTranscribing(false)

    if (result.ok) {
      const generated = result.subtitles.map((subtitle) => ({
        ...subtitle,
        id: createSubtitleId('ai'),
        start: clamp(subtitle.start + trimStart, trimStart, trimEnd),
        end: clamp(subtitle.end + trimStart, trimStart + 0.1, trimEnd),
      }))
      setSubtitles((items) => [...items, ...generated].sort((a, b) => a.start - b.start))
      showNotice(`语音识别完成，生成 ${generated.length} 条字幕。`, 'success')
    } else if (!result.canceled) {
      showNotice(result.error || '语音识别失败。', 'error')
    }
  }

  async function cancelTranscription() {
    await window.framecut?.cancelTranscription()
    setTranscribing(false)
    setTranscriptionProgress({ stage: 'idle', progress: 0, message: '' })
    showNotice('已取消语音识别。')
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <div
      className={`app-shell ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false)
      }}
      onDrop={handleDrop}
    >
      <header className="titlebar">
        <div className="brand">
          <span className="brand-mark"><Scissors size={16} strokeWidth={2.8} /></span>
          <span>FrameCut</span>
          <span className="version">BETA</span>
        </div>
        <nav className="top-nav">
          <button className="nav-button" onClick={() => inputRef.current?.click()}>
            <FolderOpen size={15} /> 打开视频
          </button>
          <button className="nav-button subtle" onClick={() => setTutorialOpen(true)}>
            <HelpCircle size={15} /> 帮助
          </button>
        </nav>
      </header>

      <main className="workspace">
        <section className="stage-panel">
          <div className="stage-toolbar">
            <div>
              <p className="eyebrow">当前项目</p>
              <h1>{media ? media.file.name.replace(/\.[^.]+$/, '') : '未命名项目'}</h1>
            </div>
            <div className="project-actions">
              {media && (
                <span className="saved-state"><CheckCircle2 size={14} /> 已自动保存</span>
              )}
              <button
                className="export-button"
                disabled={!media || exporting}
                onClick={exportClip}
              >
                <Download size={16} />
                {exporting ? `导出中 ${Math.round(exportProgress)}%` : '导出视频'}
              </button>
            </div>
          </div>

          <div className={`preview-frame ${media ? 'has-media' : ''}`}>
            {media ? (
              <>
                <video
                  ref={videoRef}
                  src={media.url}
                  style={{
                    filter: previewFilter,
                    opacity: previewOpacity,
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={updateTime}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlayback}
                />
                {activeSubtitle && (
                  <div
                    className={`subtitle-overlay subtitle-style-${activeSubtitleStyle.id}`}
                    style={{ opacity: previewOpacity }}
                  >
                    {activeSubtitle.text.split('\n').map((line, index) => (
                      <span key={`${activeSubtitle.id}-${index}`}>{line}</span>
                    ))}
                  </div>
                )}
                <button className="fullscreen-button" onClick={() => videoRef.current?.requestFullscreen()}>
                  <Maximize size={17} />
                </button>
              </>
            ) : (
              <button className="import-card" onClick={() => inputRef.current?.click()}>
                <span className="import-icon"><Upload size={26} /></span>
                <strong>导入你的第一段视频</strong>
                <span>点击选择，或将视频拖到这里</span>
                <small>支持 MP4、MOV、WebM、MKV 等常用格式</small>
              </button>
            )}
          </div>

          <div className="transport">
            <div className="transport-time">
              <span>{formatTime(currentTime, true)}</span>
              <span className="slash">/</span>
              <span>{formatTime(duration, true)}</span>
            </div>
            <div className="transport-main">
              <button
                className="icon-button"
                disabled={!media}
                title="回到入点"
                onClick={() => seekTo(trimStart)}
              >
                <RotateCcw size={18} />
              </button>
              <button
                className="play-button"
                disabled={!media}
                title="播放 / 暂停"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button
                className="icon-button"
                disabled={!media}
                title="跳到出点"
                onClick={() => seekTo(trimEnd)}
              >
                <Clock3 size={18} />
              </button>
            </div>
            <div className="volume-control">
              <button className="icon-button" onClick={() => setIsMuted((value) => !value)}>
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                aria-label="音量"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-heading">
              <div>
                <p className="eyebrow">时间轴</p>
                <span>拖动两侧把手选择要保留的片段</span>
              </div>
              <div className="trim-actions">
                <button disabled={!media} onClick={setInPoint}><span>I</span> 设为入点</button>
                <button disabled={!media} onClick={setOutPoint}><span>O</span> 设为出点</button>
                <button disabled={!media} onClick={resetTrim}><RotateCcw size={13} /> 重置</button>
              </div>
            </div>

            <div className={`timeline ${!media ? 'disabled' : ''}`}>
              <div className="ruler">
                {[0, 0.25, 0.5, 0.75, 1].map((position) => (
                  <span key={position} style={{ left: `${position * 100}%` }}>
                    {formatTime(duration * position)}
                  </span>
                ))}
              </div>
              <div className="clip-track">
                <div className="frame-strip">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <div key={index} style={{ '--frame-index': index }} />
                  ))}
                </div>
                <div className="trim-mask trim-mask-left" style={{ width: `${startPercent}%` }} />
                <div className="trim-mask trim-mask-right" style={{ width: `${100 - endPercent}%` }} />
                <div
                  className="selected-range"
                  style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
                />
                <div className="playhead" style={{ left: `${playheadPercent}%` }}>
                  <span />
                </div>
                <input
                  className="trim-range trim-range-start"
                  aria-label="入点"
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.01"
                  value={trimStart}
                  disabled={!media}
                  onChange={(event) => updateTrimStart(event.target.value)}
                />
                <input
                  className="trim-range trim-range-end"
                  aria-label="出点"
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.01"
                  value={trimEnd || duration || 1}
                  disabled={!media}
                  onChange={(event) => updateTrimEnd(event.target.value)}
                />
              </div>
              <div className="subtitle-lane">
                <span className="subtitle-lane-label"><Captions size={11} /> 字幕</span>
                <div className="subtitle-lane-track">
                  {subtitles.map((subtitle) => (
                    <button
                      key={subtitle.id}
                      className={currentTime >= subtitle.start && currentTime <= subtitle.end ? 'active' : ''}
                      title={subtitle.text}
                      style={{
                        left: `${duration ? (subtitle.start / duration) * 100 : 0}%`,
                        width: `${duration ? Math.max(0.8, ((subtitle.end - subtitle.start) / duration) * 100) : 0}%`,
                      }}
                      onClick={() => seekTo(subtitle.start)}
                    />
                  ))}
                </div>
              </div>
              <input
                className="seek-range"
                aria-label="播放位置"
                type="range"
                min="0"
                max={duration || 1}
                step="0.01"
                value={currentTime}
                disabled={!media}
                onChange={(event) => seekTo(event.target.value)}
              />
            </div>

            <div className="timeline-footer">
              <div className="time-field">
                <span>入点</span>
                <strong>{formatTime(trimStart, true)}</strong>
              </div>
              <div className="selection-duration">
                <Scissors size={14} />
                已选择 {formatTime(clipDuration, true)}
              </div>
              <div className="time-field align-right">
                <span>出点</span>
                <strong>{formatTime(trimEnd, true)}</strong>
              </div>
            </div>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-tabs">
            <button
              className={inspectorTab === 'export' ? 'active' : ''}
              onClick={() => setInspectorTab('export')}
            >
              <Settings2 size={14} /> 导出
            </button>
            <button
              className={inspectorTab === 'effects' ? 'active' : ''}
              onClick={() => setInspectorTab('effects')}
            >
              <WandSparkles size={14} /> 特效
            </button>
            <button
              className={inspectorTab === 'templates' ? 'active' : ''}
              onClick={() => setInspectorTab('templates')}
            >
              <LayoutTemplate size={14} /> 模板
            </button>
            <button
              className={inspectorTab === 'subtitles' ? 'active' : ''}
              onClick={() => setInspectorTab('subtitles')}
            >
              <Captions size={14} /> 字幕
              {subtitles.length > 0 && <span>{subtitles.length}</span>}
            </button>
          </div>

          {inspectorTab === 'export' ? (
            <>
              <div className="inspector-header">
                <div>
                  <p className="eyebrow">导出设置</p>
                  <h2>成片参数</h2>
                </div>
                <Sparkles size={19} />
              </div>

              <div className="setting-group">
                <label>格式</label>
                <button className="select-like">
                  <span><Film size={16} /> MP4 · H.264</span>
                  <ChevronDown size={15} />
                </button>
              </div>

              <div className="setting-group">
                <label>质量</label>
                <button className="select-like">
                  <span><Gauge size={16} /> 高质量</span>
                  <ChevronDown size={15} />
                </button>
                <p className="setting-help">平衡画质与文件大小，适合大多数平台。</p>
              </div>

              <div className="summary-card">
                <div className="summary-title">
                  <Clapperboard size={16} />
                  <span>导出摘要</span>
                </div>
                <dl>
                  <div><dt>片段时长</dt><dd>{formatTime(clipDuration, true)}</dd></div>
                  <div><dt>字幕</dt><dd>{subtitles.length ? `${subtitles.length} 条 · 烧录` : '无'}</dd></div>
                  <div><dt>画面特效</dt><dd>{activeEffect.name}{effectId !== 'original' ? ` · ${effectIntensity}%` : ''}</dd></div>
                  <div><dt>风格模板</dt><dd>{activeTemplate?.name || '自定义'}</dd></div>
                  <div><dt>分辨率</dt><dd>{media ? '保持原始' : '—'}</dd></div>
                  <div><dt>预计大小</dt><dd>{stats ? `约 ${stats.estimatedSize.toFixed(1)} MB` : '—'}</dd></div>
                </dl>
              </div>

              {exporting && (
                <div className="export-progress-card">
                  <div>
                    <span>正在渲染视频</span>
                    <strong>{Math.round(exportProgress)}%</strong>
                  </div>
                  <div className="progress-track"><span style={{ width: `${exportProgress}%` }} /></div>
                  <button onClick={cancelExport}>取消导出</button>
                </div>
              )}

              {exportResult && !exporting && (
                <div className="success-card">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>导出完成</strong>
                    <span>文件已经保存到所选位置。</span>
                    <button onClick={() => window.framecut.showInFolder(exportResult)}>在文件夹中显示</button>
                  </div>
                </div>
              )}

              <div className="tip-card">
                <Info size={16} />
                <p><strong>小提示</strong> 字幕轨道中的内容会直接烧录到导出视频。</p>
              </div>
            </>
          ) : inspectorTab === 'effects' ? (
            <EffectsPanel
              effectId={effectId}
              intensity={effectIntensity}
              fadeIn={fadeIn}
              fadeOut={fadeOut}
              subtitleStyleId={subtitleStyleId}
              onEffectChange={changeEffect}
              onIntensityChange={changeEffectIntensity}
              onFadeInChange={changeFadeIn}
              onFadeOutChange={changeFadeOut}
              onSubtitleStyleChange={changeSubtitleStyle}
              onReset={resetLook}
            />
          ) : inspectorTab === 'templates' ? (
            <TemplatesPanel
              activeTemplateId={activeTemplateId}
              onApply={applyTemplate}
            />
          ) : (
            <SubtitlePanel
              subtitles={subtitles}
              currentTime={currentTime}
              duration={duration}
              language={transcriptionLanguage}
              setLanguage={setTranscriptionLanguage}
              transcribing={transcribing}
              transcriptionProgress={transcriptionProgress}
              onTranscribe={transcribeMedia}
              onCancelTranscription={cancelTranscription}
              onAdd={addSubtitle}
              onImport={() => subtitleInputRef.current?.click()}
              onExport={exportSubtitles}
              onClear={() => setSubtitles([])}
              onUpdate={updateSubtitle}
              onDelete={deleteSubtitle}
              onSeek={seekTo}
              hasMedia={Boolean(media)}
            />
          )}
        </aside>
      </main>

      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept="video/*,.mkv"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <input
        ref={subtitleInputRef}
        className="hidden-input"
        type="file"
        accept=".srt,application/x-subrip,text/plain"
        onChange={(event) => importSubtitles(event.target.files?.[0])}
      />

      {isDragging && (
        <div className="drop-overlay">
          <Upload size={32} />
          <strong>松开即可导入视频</strong>
        </div>
      )}

      {notice && (
        <div className={`toast ${notice.type}`}>
          {notice.type === 'success' ? <CheckCircle2 size={17} /> : notice.type === 'error' ? <X size={17} /> : <Info size={17} />}
          {notice.message}
        </div>
      )}

      {tutorialOpen && <TutorialModal onClose={() => setTutorialOpen(false)} />}
    </div>
  )
}
