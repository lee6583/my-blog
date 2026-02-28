import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * 简单 frontmatter 解析，只关心 date / updated 字段。
 * 支持形如：
 * ---
 * title: xxx
 * date: 2026-02-20
 * updated: 2026-02-25
 * ---
 */
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { frontmatter: {}, content: raw }

  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { frontmatter: {}, content: raw }

  const fmBlock = raw.slice(3, end).trim()
  const body = raw.slice(end + 4) // 跳过结尾的 ---\n

  const frontmatter = {}
  fmBlock.split('\n').forEach((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key) frontmatter[key] = value
  })

  return { frontmatter, content: body }
}

function toDateKeyFromInput(input) {
  if (!input) return null
  const parsed = Date.parse(input)
  if (Number.isNaN(parsed)) return null
  const d = new Date(parsed)
  return formatDateKey(d)
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 统计字数：
 * - 中文：非空白的中日韩统一表意文字数量
 * - 英文：按单词数统计（用非字母数字分隔）
 */
function countWords(text) {
  if (!text) return 0

  // 去掉代码块，避免对字数干扰太大
  const withoutCode = text.replace(/```[\\s\\S]*?```/g, '')

  const chineseMatches = withoutCode.match(/[\u4e00-\u9fff]/g)
  const chineseCount = chineseMatches ? chineseMatches.length : 0

  const englishPart = withoutCode.replace(/[\u4e00-\u9fff]/g, ' ')
  const englishWords = englishPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return chineseCount + englishWords
}

async function collectMarkdownFiles(rootDir) {
  const dir = path.resolve(rootDir)
  const entries = await fs.readdir(dir, { withFileTypes: true })

  const files = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // 当前仓库 posts 下暂不嵌套目录，但保留递归以便扩展
      const subFiles = await collectMarkdownFiles(path.join(dir, entry.name))
      files.push(...subFiles)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.join(dir, entry.name))
    }
  }

  return files
}

async function main() {
  const projectRoot = process.cwd()
  const postsDir = path.join(projectRoot, 'posts')
  const outputPath = path.join(projectRoot, '.vitepress', 'words-by-day.json')

  const exists = await fs
    .stat(postsDir)
    .then(() => true)
    .catch(() => false)

  if (!exists) {
    console.warn(`[gen-words-by-day] posts 目录不存在：${postsDir}，跳过生成。`)
    return
  }

  const files = await collectMarkdownFiles(postsDir)

  const byDate = new Map()

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8')
    const { frontmatter, content } = parseFrontmatter(raw)

    let dateKey =
      toDateKeyFromInput(frontmatter.updated) ||
      toDateKeyFromInput(frontmatter.date)

    if (!dateKey) {
      const stat = await fs.stat(file)
      dateKey = formatDateKey(stat.mtime)
    }

    const words = countWords(content)
    if (!words) continue

    const current = byDate.get(dateKey) || { date: dateKey, words: 0, files: 0 }
    current.words += words
    current.files += 1
    byDate.set(dateKey, current)
  }

  const result = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')

  console.log(
    `[gen-words-by-day] 已生成 ${result.length} 天的数据 -> ${path.relative(
      projectRoot,
      outputPath,
    )}`,
  )
}

main().catch((err) => {
  console.error('[gen-words-by-day] 生成失败：', err)
  process.exit(1)
})

