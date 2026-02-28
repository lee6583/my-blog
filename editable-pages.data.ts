import { createContentLoader } from 'vitepress'

export interface EditablePageItem {
  url: string
  source: string
  sourceFile: string
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

declare const data: EditablePageItem[]
export { data }

export default createContentLoader(
  [
    'index.md',
    'about/*.md',
    'projects/*.md',
    'tags/*.md',
    'diary/*.md',
    'posts/*.md'
  ],
  {
    includeSrc: true,
    transform(raw) {
      return raw.map((entry) => ({
        url: entry.url,
        source: entry.src || '',
        sourceFile: toSourceFile(entry.url)
      }))
    }
  }
)
