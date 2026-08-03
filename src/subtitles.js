export function createSubtitleId(prefix = 'subtitle') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function parseSrtTime(value) {
  const match = String(value).trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/)
  if (!match) return 0
  const [, hours, minutes, seconds, milliseconds] = match
  return (
    Number(hours) * 3600
    + Number(minutes) * 60
    + Number(seconds)
    + Number(milliseconds.padEnd(3, '0').slice(0, 3)) / 1000
  )
}

export function formatSrtTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const milliseconds = Math.round((safe % 1) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

export function parseSrt(content) {
  return String(content)
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((block, index) => {
      const lines = block.split(/\r?\n/)
      if (/^\d+$/.test(lines[0]?.trim())) lines.shift()
      const timeIndex = lines.findIndex((line) => line.includes('-->'))
      if (timeIndex < 0) return null
      const [startValue, endValue] = lines[timeIndex].split('-->').map((value) => value.trim())
      const text = lines.slice(timeIndex + 1).join('\n').trim()
      if (!text) return null
      return {
        id: createSubtitleId(`srt-${index}`),
        start: parseSrtTime(startValue),
        end: parseSrtTime(endValue),
        text,
        source: 'import',
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
}

export function serializeSrt(subtitles) {
  return [...subtitles]
    .filter((subtitle) => subtitle.text?.trim())
    .sort((a, b) => a.start - b.start)
    .map((subtitle, index) => (
      `${index + 1}\n${formatSrtTime(subtitle.start)} --> ${formatSrtTime(subtitle.end)}\n${subtitle.text.trim()}`
    ))
    .join('\n\n')
}
