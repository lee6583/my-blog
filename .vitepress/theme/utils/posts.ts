export function toTimestamp(input: string): number {
  if (!input) return 0
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(input)
    ? `${input}T00:00:00`
    : input
  const time = Date.parse(normalized)
  return Number.isNaN(time) ? 0 : time
}

export function formatRelativeDate(input: string): string {
  const target = toTimestamp(input)
  if (!target) return '未知'

  const now = Date.now()
  const diffMs = now - target
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays <= 0) return '今天'
  if (diffDays < 30) return `${diffDays} 天前`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} 个月前`

  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} 年前`
}

export function categoryColor(category: string): string {
  const palette = [
    '#58A6FF',
    '#3FB950',
    '#F78166',
    '#D2A8FF',
    '#E3B341',
    '#79C0FF',
    '#FF7B72'
  ]

  if (!category) return palette[0]

  let hash = 0
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash << 5) - hash + category.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % palette.length
  return palette[index]
}
