import {
  Captions,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
} from 'lucide-react'
import {
  EFFECT_PRESETS,
  getCssFilter,
  SUBTITLE_STYLE_OPTIONS,
} from './looks'

export default function EffectsPanel({
  effectId,
  intensity,
  fadeIn,
  fadeOut,
  subtitleStyleId,
  onEffectChange,
  onIntensityChange,
  onFadeInChange,
  onFadeOutChange,
  onSubtitleStyleChange,
  onReset,
}) {
  const selectedEffect = EFFECT_PRESETS.find((effect) => effect.id === effectId) || EFFECT_PRESETS[0]

  return (
    <div className="effects-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">视觉特效</p>
          <h2>画面风格</h2>
        </div>
        <Sparkles size={19} />
      </div>

      <div className="effect-grid">
        {EFFECT_PRESETS.map((effect) => (
          <button
            key={effect.id}
            className={`effect-card ${effect.id === effectId ? 'active' : ''}`}
            onClick={() => onEffectChange(effect.id)}
          >
            <span
              className="effect-card-preview"
              style={{
                '--effect-accent': effect.accent,
                filter: getCssFilter(effect.id, 100),
              }}
            >
              <i />
              <em />
            </span>
            <span className="effect-card-copy">
              <strong>{effect.name}</strong>
              <small>{effect.description}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="effect-control">
        <div className="effect-control-title">
          <span><SlidersHorizontal size={13} /> 特效强度</span>
          <strong>{effectId === 'original' ? '—' : `${intensity}%`}</strong>
        </div>
        <input
          aria-label="特效强度"
          type="range"
          min="0"
          max="100"
          step="1"
          value={intensity}
          disabled={effectId === 'original'}
          onChange={(event) => onIntensityChange(Number(event.target.value))}
        />
        <p>{selectedEffect.description}</p>
      </div>

      <div className="fade-section">
        <div className="section-label"><SunMedium size={13} /> 淡入淡出</div>
        <div className="fade-fields">
          <label>
            <span>片头淡入</span>
            <div><input aria-label="片头淡入时长" type="number" min="0" max="3" step="0.1" value={fadeIn} onChange={(event) => onFadeInChange(Number(event.target.value))} /><em>秒</em></div>
          </label>
          <label>
            <span>片尾淡出</span>
            <div><input aria-label="片尾淡出时长" type="number" min="0" max="3" step="0.1" value={fadeOut} onChange={(event) => onFadeOutChange(Number(event.target.value))} /><em>秒</em></div>
          </label>
        </div>
      </div>

      <div className="subtitle-style-section">
        <div className="section-label"><Captions size={13} /> 字幕外观</div>
        <div className="subtitle-style-grid">
          {SUBTITLE_STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              className={`subtitle-style-option subtitle-style-${style.id} ${style.id === subtitleStyleId ? 'active' : ''}`}
              onClick={() => onSubtitleStyleChange(style.id)}
            >
              <span>{style.sample}</span>
              <small>{style.name}</small>
            </button>
          ))}
        </div>
      </div>

      <button className="reset-look-button" onClick={onReset}>
        <RotateCcw size={13} /> 恢复默认外观
      </button>
    </div>
  )
}
