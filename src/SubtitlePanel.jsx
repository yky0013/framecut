import {
  Captions,
  Download,
  FileUp,
  Languages,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'

function shortTime(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60)
  const secs = Math.max(0, seconds) % 60
  return `${String(minutes).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`
}

export default function SubtitlePanel({
  subtitles,
  currentTime,
  duration,
  language,
  setLanguage,
  transcribing,
  transcriptionProgress,
  onTranscribe,
  onCancelTranscription,
  onAdd,
  onImport,
  onExport,
  onClear,
  onUpdate,
  onDelete,
  onSeek,
  hasMedia,
}) {
  return (
    <div className="subtitle-panel">
      <div className="ai-card">
        <div className="ai-card-heading">
          <span className="ai-icon"><WandSparkles size={17} /></span>
          <div>
            <strong>本地语音转字幕</strong>
            <span>Whisper · 视频不会上传</span>
          </div>
        </div>

        <label className="language-select">
          <Languages size={14} />
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="auto">自动识别语言</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </label>

        {transcribing ? (
          <div className="transcription-status">
            <div className="transcription-message">
              <LoaderCircle className="spin" size={14} />
              <span>{transcriptionProgress.message}</span>
              <strong>{Math.round(transcriptionProgress.progress || 0)}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${transcriptionProgress.progress || 0}%` }} />
            </div>
            <button onClick={onCancelTranscription}><X size={12} /> 取消识别</button>
          </div>
        ) : (
          <button className="transcribe-button" disabled={!hasMedia} onClick={onTranscribe}>
            <Sparkles size={15} />
            识别当前裁剪范围
          </button>
        )}

        <p>Whisper 模型已随软件安装，全程离线识别，无需下载或上传视频。</p>
      </div>

      <div className="subtitle-toolbar">
        <button disabled={!hasMedia} onClick={onAdd}><Plus size={13} /> 新增</button>
        <button onClick={onImport}><FileUp size={13} /> 导入 SRT</button>
        <button disabled={subtitles.length === 0} onClick={onExport}><Download size={13} /> 导出</button>
        <button className="danger-quiet" disabled={subtitles.length === 0} onClick={onClear}>
          <Trash2 size={13} />
        </button>
      </div>

      <div className="subtitle-count">
        <span><Captions size={13} /> 字幕轨道</span>
        <strong>{subtitles.length} 条</strong>
      </div>

      <div className="subtitle-list">
        {subtitles.length === 0 ? (
          <div className="subtitle-empty">
            <Captions size={22} />
            <strong>还没有字幕</strong>
            <span>手动新增、导入 SRT，或使用语音识别。</span>
          </div>
        ) : (
          subtitles.map((subtitle, index) => {
            const active = currentTime >= subtitle.start && currentTime <= subtitle.end
            return (
              <article
                className={`subtitle-item ${active ? 'active' : ''}`}
                key={subtitle.id}
                onClick={() => onSeek(subtitle.start)}
              >
                <div className="subtitle-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="subtitle-editor">
                  <div className="subtitle-time-fields">
                    <label>
                      <span>开始</span>
                      <input
                        type="number"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={Number(subtitle.start.toFixed(2))}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onUpdate(subtitle.id, {
                          start: Math.min(Number(event.target.value), subtitle.end - 0.1),
                        })}
                      />
                    </label>
                    <span className="time-arrow">→</span>
                    <label>
                      <span>结束</span>
                      <input
                        type="number"
                        min="0.1"
                        max={duration || 0}
                        step="0.1"
                        value={Number(subtitle.end.toFixed(2))}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onUpdate(subtitle.id, {
                          end: Math.max(Number(event.target.value), subtitle.start + 0.1),
                        })}
                      />
                    </label>
                    <small>{shortTime(subtitle.start)}</small>
                  </div>
                  <textarea
                    value={subtitle.text}
                    rows="2"
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onUpdate(subtitle.id, { text: event.target.value })}
                  />
                </div>
                <button
                  className="delete-subtitle"
                  title="删除字幕"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(subtitle.id)
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
