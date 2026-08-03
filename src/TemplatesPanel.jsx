import {
  Check,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react'
import {
  getCssFilter,
  STYLE_TEMPLATES,
} from './looks'

export default function TemplatesPanel({ activeTemplateId, onApply }) {
  return (
    <div className="templates-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">一键模板</p>
          <h2>成片风格</h2>
        </div>
        <LayoutTemplate size={19} />
      </div>

      <div className="template-intro">
        <Sparkles size={15} />
        <p>模板会同时设置画面特效、淡入淡出和字幕外观，应用后仍可继续微调。</p>
      </div>

      <div className="template-list">
        {STYLE_TEMPLATES.map((template) => {
          const active = template.id === activeTemplateId
          return (
            <button
              key={template.id}
              className={`template-card ${active ? 'active' : ''}`}
              onClick={() => onApply(template)}
            >
              <span
                className="template-thumbnail"
                style={{
                  '--template-accent': template.accent,
                  filter: getCssFilter(template.effectId, template.intensity),
                }}
              >
                <i />
                <b>{template.tag}</b>
                <em className={`template-caption subtitle-style-${template.subtitleStyleId}`}>FrameCut</em>
              </span>
              <span className="template-copy">
                <strong>{template.name}</strong>
                <small>{template.description}</small>
                <em>{active ? <><Check size={11} /> 已应用</> : '点击套用'}</em>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
