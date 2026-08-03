import { useEffect, useState } from 'react'
import {
  Captions,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Keyboard,
  LayoutTemplate,
  MousePointer2,
  Scissors,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react'

const steps = [
  {
    id: 'import',
    eyebrow: '第 1 步',
    title: '导入视频',
    description: '从电脑选择视频，也可以直接拖进 FrameCut。',
    points: [
      '点击右上角“打开视频”，选择 MP4、MOV、WebM 或 MKV。',
      '也可以把视频拖到主窗口，松开鼠标即可导入。',
      '导入后会自动读取时长，并显示预览画面和时间轴。',
    ],
    tip: 'FrameCut 只读取本地文件，不会上传原视频。',
    figure: 'import',
  },
  {
    id: 'trim',
    eyebrow: '第 2 步',
    title: '选择保留片段',
    description: '通过入点和出点，精确决定最后保留哪一段。',
    points: [
      '播放视频，将播放头移动到想要开始的位置。',
      '点击“设为入点”或按 I 键，确定片段起点。',
      '移动到结束位置，点击“设为出点”或按 O 键。',
    ],
    tip: '亮绿色框内是最终导出的范围，空格键可播放或暂停。',
    figure: 'trim',
  },
  {
    id: 'effects',
    eyebrow: '第 3 步',
    title: '添加画面特效',
    description: '选择滤镜、调整强度，并设置画面淡入淡出。',
    points: [
      '打开右侧“特效”标签，从六种画面风格中选择一种。',
      '拖动强度滑块，实时观察预览画面的变化。',
      '按需设置片头淡入、片尾淡出和字幕外观。',
    ],
    tip: '特效会随视频一起渲染，导出的 MP4 与预览保持一致。',
    figure: 'effects',
  },
  {
    id: 'templates',
    eyebrow: '第 4 步',
    title: '一键套用模板',
    description: '快速组合画面特效、淡化转场和字幕风格。',
    points: [
      '打开右侧“模板”标签，浏览六套成片风格。',
      '点击模板卡片，即可一键应用全部视觉参数。',
      '应用后仍可回到“特效”面板继续微调。',
    ],
    tip: '模板不会修改原视频文件，只影响当前项目的预览与导出。',
    figure: 'templates',
  },
  {
    id: 'caption',
    eyebrow: '第 5 步',
    title: '手动添加字幕',
    description: '在右侧字幕面板中新增字幕并校准时间。',
    points: [
      '点击右侧“字幕”标签，再点击“新增”。',
      '填写字幕的开始时间、结束时间和文字内容。',
      '点击字幕卡片可跳到对应画面，方便逐句核对。',
    ],
    tip: '预览画面和字幕时间轴会立即同步更新。',
    figure: 'caption',
  },
  {
    id: 'speech',
    eyebrow: '第 6 步',
    title: '语音自动转字幕',
    description: '使用内置 Whisper 模型，在本机自动识别当前片段。',
    points: [
      '在字幕面板选择“自动识别语言”、中文或英文。',
      '点击“识别当前片段”，等待语音提取和识别完成。',
      '识别结果会自动生成带时间戳的可编辑字幕。',
    ],
    tip: '首次识别需要加载本地模型，稍等片刻即可；整个过程无需联网。',
    figure: 'speech',
  },
  {
    id: 'srt',
    eyebrow: '第 7 步',
    title: '校对与 SRT 文件',
    description: '修正识别文字，也可以和其他字幕软件交换文件。',
    points: [
      '直接修改字幕卡片中的文字与起止时间。',
      '点击“导入 SRT”，载入已有字幕文件。',
      '点击“导出”，把当前字幕保存为标准 SRT 文件。',
    ],
    tip: '自动识别可能受口音、噪声和背景音乐影响，导出前建议快速校对。',
    figure: 'srt',
  },
  {
    id: 'export',
    eyebrow: '第 8 步',
    title: '导出成片',
    description: '确认片段和字幕后，生成可直接播放的 MP4。',
    points: [
      '切换到右侧“导出”标签，检查片段时长和字幕数量。',
      '点击顶部“导出视频”，选择保存位置和文件名。',
      '等待进度达到 100%，即可在文件夹中查看成片。',
    ],
    tip: '字幕会直接烧录到视频画面中，其他播放器无需额外加载 SRT。',
    figure: 'export',
  },
]

function TutorialFigure({ type }) {
  if (type === 'import') {
    return (
      <div className="tutorial-visual import-visual" aria-label="导入视频界面示意图">
        <div className="mini-titlebar">
          <span className="mini-brand"><Scissors size={11} /> FrameCut</span>
          <span className="mini-open"><FolderOpen size={11} /> 打开视频</span>
        </div>
        <div className="mini-dropzone">
          <span><Upload size={27} /></span>
          <strong>导入你的第一段视频</strong>
          <small>点击选择，或将视频拖到这里</small>
        </div>
        <div className="tutorial-callout callout-one"><b>1</b> 点击选择</div>
        <div className="tutorial-callout callout-two"><b>2</b> 或拖放文件</div>
      </div>
    )
  }

  if (type === 'trim') {
    return (
      <div className="tutorial-visual trim-visual" aria-label="剪辑时间轴示意图">
        <div className="mini-preview">
          <div className="mini-play"><span>▶</span></div>
        </div>
        <div className="mini-transport"><span>00:08.240</span><b>播放 / 暂停</b><span>00:24.000</span></div>
        <div className="mini-timeline">
          <div className="trim-dim left" />
          <div className="trim-selection">
            <span className="trim-handle start" />
            <span className="trim-playhead" />
            <span className="trim-handle end" />
          </div>
          <div className="trim-dim right" />
        </div>
        <div className="mini-io"><span><kbd>I</kbd> 设为入点</span><span><kbd>O</kbd> 设为出点</span></div>
      </div>
    )
  }

  if (type === 'effects') {
    return (
      <div className="tutorial-visual effects-visual" aria-label="视频特效设置示意图">
        <div className="tutorial-effect-sidebar">
          <div><WandSparkles size={15} /><strong>画面风格</strong></div>
          <span className="selected">电影感</span>
          <span>鲜亮</span>
          <span>暖阳</span>
          <span>清冷</span>
        </div>
        <div className="tutorial-effect-preview">
          <span className="effect-preview-person" />
          <b>CINEMATIC LOOK</b>
        </div>
        <div className="tutorial-effect-controls">
          <span><SlidersHorizontal size={12} /> 特效强度 <b>82%</b></span>
          <i><em style={{ width: '82%' }} /></i>
          <div><small>片头淡入 0.8 秒</small><small>片尾淡出 0.8 秒</small></div>
        </div>
      </div>
    )
  }

  if (type === 'templates') {
    return (
      <div className="tutorial-visual templates-visual" aria-label="成片模板示意图">
        {[
          ['电影叙事', 'CINEMA', '#76a9ff'],
          ['热门短视频', 'SOCIAL', '#ff5f8d'],
          ['未来科技', 'TECH', '#56e6ff'],
        ].map(([name, tag, accent], index) => (
          <div className={`tutorial-template-card ${index === 0 ? 'selected' : ''}`} key={name}>
            <div style={{ '--tutorial-template-accent': accent }}>
              <LayoutTemplate size={16} />
              <b>{tag}</b>
              <span>FrameCut</span>
            </div>
            <strong>{name}</strong>
            <small>{index === 0 ? '已应用' : '点击套用'}</small>
          </div>
        ))}
        <div className="template-combo">
          <Sparkles size={13} />
          画面特效 ＋ 淡化转场 ＋ 字幕外观
        </div>
      </div>
    )
  }

  if (type === 'caption') {
    return (
      <div className="tutorial-visual caption-visual" aria-label="手动字幕编辑示意图">
        <div className="caption-stage">
          <span className="caption-person" />
          <p>在这里预览字幕效果</p>
        </div>
        <div className="caption-panel">
          <div className="mini-tabs"><span>导出</span><b>字幕 <em>1</em></b></div>
          <button><Captions size={11} /> 新增字幕</button>
          <div className="caption-editor">
            <small>00:03.200 → 00:06.800</small>
            <strong>欢迎使用 FrameCut</strong>
          </div>
        </div>
        <div className="caption-lane"><span /></div>
      </div>
    )
  }

  if (type === 'speech') {
    return (
      <div className="tutorial-visual speech-visual" aria-label="离线语音识别示意图">
        <div className="speech-card">
          <div className="speech-heading">
            <span><WandSparkles size={16} /></span>
            <div><strong>本地语音转字幕</strong><small>Whisper · 视频不会上传</small></div>
          </div>
          <div className="mini-select">自动识别语言 <span>⌄</span></div>
          <button><Sparkles size={12} /> 识别当前片段</button>
          <div className="mini-progress"><span style={{ width: '72%' }} /></div>
          <small>正在识别语音… 72%</small>
        </div>
        <div className="speech-results">
          <span><b>01</b> 今天我们来学习视频剪辑</span>
          <span><b>02</b> 字幕已经自动生成</span>
        </div>
      </div>
    )
  }

  if (type === 'srt') {
    return (
      <div className="tutorial-visual srt-visual" aria-label="SRT 字幕文件示意图">
        <div className="srt-toolbar">
          <span><Captions size={12} /> 新增</span>
          <span><FileText size={12} /> 导入 SRT</span>
          <b><Download size={12} /> 导出</b>
        </div>
        <div className="srt-document">
          <div className="srt-page-corner" />
          <strong>1</strong>
          <code>00:00:03,200 → 00:00:06,800</code>
          <p>欢迎使用 FrameCut</p>
          <strong>2</strong>
          <code>00:00:07,100 → 00:00:09,500</code>
          <p>字幕可以继续编辑</p>
        </div>
        <div className="srt-check"><Check size={13} /> 标准 SRT 格式</div>
      </div>
    )
  }

  return (
    <div className="tutorial-visual export-visual" aria-label="导出视频示意图">
      <div className="export-summary">
        <small>导出摘要</small>
        <dl>
          <div><dt>片段时长</dt><dd>00:24.000</dd></div>
          <div><dt>字幕</dt><dd>8 条 · 烧录</dd></div>
          <div><dt>格式</dt><dd>MP4 · H.264</dd></div>
        </dl>
      </div>
      <div className="export-flow">
        <button><Download size={13} /> 导出视频</button>
        <span className="flow-line" />
        <span className="export-file"><FileText size={25} /><b>成片.mp4</b></span>
      </div>
      <div className="export-success"><Check size={14} /> 导出完成</div>
    </div>
  )
}

export default function TutorialModal({ onClose }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStep = steps[activeIndex]

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="tutorial-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose()
    }}>
      <section className="tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <header className="tutorial-header">
          <div>
            <span className="tutorial-logo"><Scissors size={15} /></span>
            <div>
              <p>FrameCut 使用指南</p>
              <h2 id="tutorial-title">8 步完成剪辑、特效与字幕</h2>
            </div>
          </div>
          <button className="tutorial-close" onClick={onClose} aria-label="关闭教程"><X size={18} /></button>
        </header>

        <div className="tutorial-body">
          <aside className="tutorial-sidebar">
            <p>快速开始</p>
            <nav>
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={index === activeIndex ? 'active' : ''}
                  onClick={() => setActiveIndex(index)}
                >
                  <span>{index + 1}</span>
                  <div><strong>{step.title}</strong><small>{step.description}</small></div>
                  {index < activeIndex && <Check size={13} />}
                </button>
              ))}
            </nav>
            <div className="tutorial-privacy">
              <ShieldCheck size={16} />
              <div><strong>本地离线处理</strong><small>视频和语音不会上传</small></div>
            </div>
          </aside>

          <main className="tutorial-content">
            <div className="tutorial-step-heading">
              <div>
                <p>{activeStep.eyebrow}</p>
                <h3>{activeStep.title}</h3>
                <span>{activeStep.description}</span>
              </div>
              <span className="tutorial-step-number">{String(activeIndex + 1).padStart(2, '0')}</span>
            </div>

            <TutorialFigure type={activeStep.figure} />

            <div className="tutorial-instructions">
              {activeStep.points.map((point, index) => (
                <div key={point}>
                  <span>{index + 1}</span>
                  <p>{point}</p>
                </div>
              ))}
            </div>

            <div className="tutorial-tip">
              <MousePointer2 size={15} />
              <p><strong>操作提示</strong>{activeStep.tip}</p>
            </div>
          </main>
        </div>

        <footer className="tutorial-footer">
          <div className="tutorial-shortcuts">
            <Keyboard size={14} />
            <span><kbd>Space</kbd> 播放/暂停</span>
            <span><kbd>I</kbd> 入点</span>
            <span><kbd>O</kbd> 出点</span>
            <span><kbd>Esc</kbd> 关闭教程</span>
          </div>
          <div className="tutorial-pagination">
            <button
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              <ChevronLeft size={15} /> 上一步
            </button>
            <span>{activeIndex + 1} / {steps.length}</span>
            {activeIndex < steps.length - 1 ? (
              <button className="primary" onClick={() => setActiveIndex((index) => index + 1)}>
                下一步 <ChevronRight size={15} />
              </button>
            ) : (
              <button className="primary" onClick={onClose}>
                开始剪辑 <Check size={15} />
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  )
}
