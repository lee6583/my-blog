import { createContentLoader } from 'vitepress'

export interface PostItem {
  title: string
  url: string
  date: string
  updated: string
  isDiary: boolean
  description: string
  tags: string[]
  category: string
  private: boolean
  stars: number
  forks: number
  sortTime: number
  wordCount: number
  source: string
  sourceFile: string
}

function toTimestamp(input: string): number {
  if (!input) return 0
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(input)
    ? `${input}T00:00:00`
    : input
  const time = Date.parse(normalized)
  return Number.isNaN(time) ? 0 : time
}

function toString(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim()
}

function toDateString(input: unknown): string {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10)
  }

  if (typeof input === 'number' && Number.isFinite(input)) {
    const date = new Date(input)
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  }

  if (typeof input === 'string') {
    const value = input.trim()
    if (!value) return ''
    const time = Date.parse(value)
    if (Number.isNaN(time)) return ''
    return new Date(time).toISOString().slice(0, 10)
  }

  return ''
}

function toStringList(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumber(input: unknown): number {
  const value = Number(input)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

function toBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') return input
  if (typeof input === 'string') return input.toLowerCase() === 'true'
  return false
}

function toSourceFile(url: string): string {
  const normalized = url
    .split('#')[0]
    .split('?')[0]
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html$/, '')
  if (!normalized) return 'index.md'
  return `${normalized}.md`
}

function isDiaryPost(
  category: string,
  tags: string[],
  frontmatter: Record<string, unknown>
): boolean {
  if (toBoolean(frontmatter.diary)) return true
  if (category === '日记') return true
  return tags.some((tag) => {
    const normalized = tag.trim().toLowerCase()
    return normalized === '日记' || normalized === 'diary'
  })
}

function countWordsFromMarkdown(src: string | undefined): number {
  if (!src) return 0

  const withoutCode = src.replace(/```[\s\S]*?```/g, '')
  const withoutFrontmatter = withoutCode.replace(/^---[\s\S]*?---/, '')
  const plain = withoutFrontmatter
    .replace(/[#>*_`~+\-[\]()>!]/g, ' ')
    .replace(/\s+/g, '')
    .trim()

  if (!plain) return 0
  return plain.length
}

function cleanExcerpt(excerpt: string): string {
  return excerpt.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

declare const data: PostItem[]
export { data }

export default createContentLoader('posts/*.md', {
  includeSrc: true,
  excerpt: true,
  transform(raw) {
    return raw
      .map((entry) => {
        const fm = (entry.frontmatter ?? {}) as Record<string, unknown>
        const title = toString(fm.title)
        const date = toDateString(fm.date)
        if (!title || !date) return null

        const tags = toStringList(fm.tags)
        const updated = toDateString(fm.updated) || date
        const wordCount = countWordsFromMarkdown(entry.src)
        const description =
          toString(fm.description) ||
          cleanExcerpt(entry.excerpt || '') ||
          '暂无摘要'
        const category = toString(fm.category) || tags[0] || '未分类'
        const source = entry.src || ''
        const sourceFile = toSourceFile(entry.url)
        const isDiary = isDiaryPost(category, tags, fm)

        return {
          title,
          url: entry.url,
          date,
          updated,
          isDiary,
          description,
          tags,
          category,
          private: toBoolean(fm.private),
          stars: toNumber(fm.stars),
          forks: toNumber(fm.forks),
          sortTime: toTimestamp(updated) || toTimestamp(date),
          wordCount,
          source,
          sourceFile
        } satisfies PostItem
      })
      .filter((item): item is PostItem => item !== null)
      .sort((a, b) => b.sortTime - a.sortTime)
  }
})
