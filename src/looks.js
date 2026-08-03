export const EFFECT_PRESETS = [
  {
    id: 'original',
    name: '原画',
    description: '保留素材原始色彩',
    accent: '#bfc0c5',
    targets: {},
  },
  {
    id: 'cinematic',
    name: '电影感',
    description: '低饱和、高对比、冷调',
    accent: '#76a9ff',
    targets: {
      brightness: 0.95,
      contrast: 1.18,
      saturation: 0.88,
      hue: 2,
    },
  },
  {
    id: 'vivid',
    name: '鲜亮',
    description: '提升色彩与画面冲击力',
    accent: '#ff5f8d',
    targets: {
      brightness: 1.03,
      contrast: 1.1,
      saturation: 1.5,
      hue: 0,
    },
  },
  {
    id: 'warm',
    name: '暖阳',
    description: '温暖肤色与金色高光',
    accent: '#ffad4d',
    targets: {
      brightness: 1.04,
      contrast: 1.06,
      saturation: 1.17,
      sepia: 0.22,
      hue: -4,
    },
  },
  {
    id: 'cool',
    name: '清冷',
    description: '蓝青色科技氛围',
    accent: '#56e6ff',
    targets: {
      brightness: 1,
      contrast: 1.1,
      saturation: 1.08,
      hue: 12,
    },
  },
  {
    id: 'noir',
    name: '黑白',
    description: '高反差纪实质感',
    accent: '#e6e6e8',
    targets: {
      brightness: 0.96,
      contrast: 1.28,
      saturation: 1,
      grayscale: 1,
    },
  },
  {
    id: 'vintage',
    name: '复古胶片',
    description: '褪色色彩与柔和暖调',
    accent: '#d4a76a',
    targets: {
      brightness: 1.02,
      contrast: 0.94,
      saturation: 0.82,
      sepia: 0.42,
      hue: -7,
    },
  },
]

export const SUBTITLE_STYLE_OPTIONS = [
  {
    id: 'classic',
    name: '经典白',
    sample: '经典',
  },
  {
    id: 'yellow',
    name: '活力黄',
    sample: '活力',
  },
  {
    id: 'cyan',
    name: '霓虹青',
    sample: '科技',
  },
  {
    id: 'cinema',
    name: '电影底条',
    sample: '电影',
  },
]

export const STYLE_TEMPLATES = [
  {
    id: 'clean',
    name: '清爽日常',
    description: '自然原色、轻柔淡化、经典字幕',
    tag: 'VLOG',
    effectId: 'original',
    intensity: 100,
    fadeIn: 0.2,
    fadeOut: 0.2,
    subtitleStyleId: 'classic',
    accent: '#d5ff40',
  },
  {
    id: 'cinematic-story',
    name: '电影叙事',
    description: '冷调高反差与电影底条',
    tag: 'CINEMA',
    effectId: 'cinematic',
    intensity: 82,
    fadeIn: 0.8,
    fadeOut: 0.8,
    subtitleStyleId: 'cinema',
    accent: '#76a9ff',
  },
  {
    id: 'social-pop',
    name: '热门短视频',
    description: '鲜艳画面与醒目黄色字幕',
    tag: 'SOCIAL',
    effectId: 'vivid',
    intensity: 76,
    fadeIn: 0.18,
    fadeOut: 0.25,
    subtitleStyleId: 'yellow',
    accent: '#ff5f8d',
  },
  {
    id: 'retro-memory',
    name: '复古回忆',
    description: '暖色褪色胶片与柔和转场',
    tag: 'RETRO',
    effectId: 'vintage',
    intensity: 80,
    fadeIn: 0.65,
    fadeOut: 0.65,
    subtitleStyleId: 'classic',
    accent: '#d4a76a',
  },
  {
    id: 'documentary',
    name: '黑白纪实',
    description: '黑白高反差与沉浸式底条',
    tag: 'DOC',
    effectId: 'noir',
    intensity: 100,
    fadeIn: 0.45,
    fadeOut: 0.45,
    subtitleStyleId: 'cinema',
    accent: '#e6e6e8',
  },
  {
    id: 'future-tech',
    name: '未来科技',
    description: '蓝青冷调与霓虹字幕',
    tag: 'TECH',
    effectId: 'cool',
    intensity: 72,
    fadeIn: 0.3,
    fadeOut: 0.3,
    subtitleStyleId: 'cyan',
    accent: '#56e6ff',
  },
]

export function getEffectPreset(effectId) {
  return EFFECT_PRESETS.find((effect) => effect.id === effectId) || EFFECT_PRESETS[0]
}

export function getSubtitleStyle(subtitleStyleId) {
  return SUBTITLE_STYLE_OPTIONS.find((style) => style.id === subtitleStyleId)
    || SUBTITLE_STYLE_OPTIONS[0]
}

export function getTemplate(templateId) {
  return STYLE_TEMPLATES.find((template) => template.id === templateId) || null
}

function blendNeutral(target, intensity, neutral = 1) {
  return neutral + (target - neutral) * intensity
}

function clean(value) {
  return Number(value.toFixed(3))
}

export function getCssFilter(effectId, intensityValue = 100) {
  const effect = getEffectPreset(effectId)
  if (effect.id === 'original') return 'none'

  const intensity = Math.max(0, Math.min(100, Number(intensityValue) || 0)) / 100
  const targets = effect.targets
  const filters = [
    `brightness(${clean(blendNeutral(targets.brightness ?? 1, intensity))})`,
    `contrast(${clean(blendNeutral(targets.contrast ?? 1, intensity))})`,
    `saturate(${clean(blendNeutral(targets.saturation ?? 1, intensity))})`,
  ]

  if (targets.sepia) filters.push(`sepia(${clean(targets.sepia * intensity)})`)
  if (targets.grayscale) filters.push(`grayscale(${clean(targets.grayscale * intensity)})`)
  if (targets.hue) filters.push(`hue-rotate(${clean(targets.hue * intensity)}deg)`)
  return filters.join(' ')
}

export function getFadeOpacity(currentTime, trimStart, trimEnd, fadeIn, fadeOut) {
  let opacity = 1
  const safeFadeIn = Math.max(0, Number(fadeIn) || 0)
  const safeFadeOut = Math.max(0, Number(fadeOut) || 0)

  if (safeFadeIn > 0) {
    opacity = Math.min(opacity, Math.max(0, (currentTime - trimStart) / safeFadeIn))
  }
  if (safeFadeOut > 0) {
    opacity = Math.min(opacity, Math.max(0, (trimEnd - currentTime) / safeFadeOut))
  }
  return Math.max(0, Math.min(1, opacity))
}
