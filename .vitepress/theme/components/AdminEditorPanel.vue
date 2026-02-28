<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { inBrowser, useData, useRoute } from 'vitepress'
import { data as editablePages } from '../../../editable-pages.data'
import type { EditablePageItem } from '../../../editable-pages.data'
import { useAdminMode } from '../composables/admin'

const ADMIN_IDLE_TIMEOUT_MS = 3 * 60 * 1000
const DEFAULT_GITHUB_OWNER = 'lee6583'
const DEFAULT_GITHUB_REPO = 'my-blog'
const DEFAULT_GITHUB_BRANCH = 'main'
// 勿将 Token 写进仓库。本地在 .env.local 中设置 VITE_GITHUB_TOKEN，该文件已在 .gitignore
const DEFAULT_GITHUB_TOKEN = typeof import.meta.env !== 'undefined' && import.meta.env?.VITE_GITHUB_TOKEN
  ? String(import.meta.env.VITE_GITHUB_TOKEN)
  : ''

type StatusType = 'info' | 'success' | 'error'

interface GitHubSyncConfig {
  enabled: boolean
  owner: string
  repo: string
  branch: string
  token: string
}

interface PendingImageUpload {
  file: File
  repoPath: string
}

class GitHubApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const route = useRoute()
const { site } = useData()

const {
  isAdminMode,
  isAuthModalOpen,
  openAuthModal,
  closeAuthModal,
  verifyPassword
} = useAdminMode()

const password = ref('')
const authError = ref('')
const isEditorOpen = ref(false)
const isSaving = ref(false)
const editorContent = ref('')
const lastSavedContent = ref('')
const statusMessage = ref('')
const statusType = ref<StatusType>('info')
const editorTextarea = ref<HTMLTextAreaElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const workspaceHandle = ref<FileSystemDirectoryHandle | null>(null)
const editingPage = ref<EditablePageItem | null>(null)
const isPostManagerOpen = ref(false)
const managerScope = ref<'posts' | 'diary'>('posts')
const creatingPost = ref(false)

const githubSync = reactive<GitHubSyncConfig>({
  enabled: true,
  owner: DEFAULT_GITHUB_OWNER,
  repo: DEFAULT_GITHUB_REPO,
  branch: DEFAULT_GITHUB_BRANCH,
  token: DEFAULT_GITHUB_TOKEN
})

const pendingImageUploads = new Map<string, PendingImageUpload>()
let idleTimer: number | null = null
let statusTimer: number | null = null

const newPostForm = reactive({
  title: '',
  slug: '',
  date: new Date().toISOString().slice(0, 10),
  description: ''
})

const allPages = editablePages as EditablePageItem[]
const pageByPath = new Map<string, EditablePageItem>()
for (const page of allPages) {
  pageByPath.set(normalizePath(page.url), page)
}

const currentPage = computed(
  () => pageByPath.get(normalizePath(route.path)) || null
)

const managedPosts = computed(() => {
  const list = allPages.filter((page) => page.sourceFile.startsWith('posts/'))
  if (managerScope.value === 'diary') {
    return list.filter((page) => inferDiaryBySource(page.source))
  }
  return list
})

const hasGitHubSync = computed(() => {
  return (
    githubSync.enabled &&
    !!githubSync.owner.trim() &&
    !!githubSync.repo.trim() &&
    !!githubSync.branch.trim() &&
    !!githubSync.token.trim()
  )
})

watch(isAuthModalOpen, (open) => {
  if (!open) return
  password.value = ''
  authError.value = ''
})

watch(
  () => normalizePath(route.path),
  async () => {
    if (!isEditorOpen.value) return

    const currentEditing = editingPage.value
    const currentRoutePage = currentPage.value
    if (
      currentEditing &&
      currentRoutePage &&
      currentEditing.sourceFile === currentRoutePage.sourceFile
    ) {
      return
    }

    await persistDraft('切换页面自动保存')
    leaveEditMode()
  }
)

watch(isAdminMode, (enabled) => {
  if (!enabled) {
    leaveEditMode()
    isPostManagerOpen.value = false
  }
})

function normalizePath(input: string): string {
  const raw = (input || '').split('#')[0].split('?')[0]
  const base = site.value.base || '/'
  let path = raw

  if (base !== '/' && path.startsWith(base)) {
    path = `/${path.slice(base.length)}`
  }

  path = path
    .replace(/\/index\.html$/, '/')
    .replace(/\/index$/, '/')
    .replace(/\.html$/, '')

  if (!path.startsWith('/')) path = `/${path}`
  if (path.length > 1) path = path.replace(/\/$/, '')
  return path
}

function setStatus(message: string, type: StatusType = 'info') {
  if (statusTimer !== null) {
    window.clearTimeout(statusTimer)
    statusTimer = null
  }
  statusMessage.value = message
  statusType.value = type

  if (!message) return
  statusTimer = window.setTimeout(() => {
    statusMessage.value = ''
    statusTimer = null
  }, 2000)
}

function clearIdleTimer() {
  if (idleTimer !== null) {
    window.clearTimeout(idleTimer)
    idleTimer = null
  }
}

function resetIdleTimer() {
  if (!inBrowser || !isEditorOpen.value) return
  clearIdleTimer()
  idleTimer = window.setTimeout(() => {
    void handleIdleTimeout()
  }, ADMIN_IDLE_TIMEOUT_MS)
}

function leaveEditMode() {
  isEditorOpen.value = false
  editingPage.value = null
  clearIdleTimer()
}

async function handleIdleTimeout() {
  if (!isEditorOpen.value) return
  await persistDraft('自动保存')
  leaveEditMode()
  setStatus('长时间未编辑，已自动保存并退出编辑态。', 'info')
}

async function openEditorForCurrentRoute() {
  if (!isAdminMode.value) return

  const target = currentPage.value
  if (!target) {
    if (isEditorOpen.value) {
      await persistDraft('离开页面自动保存')
      leaveEditMode()
    }
    return
  }

  const currentEditing = editingPage.value
  if (
    isEditorOpen.value &&
    currentEditing &&
    currentEditing.sourceFile === target.sourceFile
  ) {
    resetIdleTimer()
    return
  }

  if (isEditorOpen.value && currentEditing) {
    await persistDraft('切换页面自动保存')
  }

  editingPage.value = target
  editorContent.value = target.source || ''
  lastSavedContent.value = target.source || ''
  isEditorOpen.value = true
  setStatus('')

  await nextTick()
  editorTextarea.value?.focus()
  resetIdleTimer()
}

function onOpenEditorEvent() {
  if (!isAdminMode.value) {
    openAuthModal()
    return
  }
  void openEditorForCurrentRoute()
}

function onOpenPostManagerEvent(event: Event) {
  if (!isAdminMode.value) {
    openAuthModal()
    return
  }

  const detail = (event as CustomEvent<{ scope?: 'posts' | 'diary' }>).detail
  managerScope.value = detail?.scope === 'diary' ? 'diary' : 'posts'
  resetNewPostForm()
  isPostManagerOpen.value = true
}

function submitAuth() {
  const ok = verifyPassword(password.value.trim())
  if (!ok) {
    authError.value = '密码错误，请重试。'
    return
  }

  authError.value = ''
  setStatus('权限校验通过。可在文章顶部点击“编辑”进入编辑态。', 'success')
}

function resetNewPostForm() {
  newPostForm.title = ''
  newPostForm.slug = ''
  newPostForm.description = ''
  newPostForm.date = new Date().toISOString().slice(0, 10)
}

function inferDiaryBySource(source: string): boolean {
  if (/^\s*diary:\s*true\s*$/im.test(source)) return true
  if (/^\s*category:\s*日记\s*$/im.test(source)) return true
  return /^\s*-\s*(日记|diary)\s*$/im.test(source)
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
}

function quoteYaml(input: string): string {
  return JSON.stringify(input || '')
}

function buildPostContent(
  title: string,
  date: string,
  description: string,
  isDiary: boolean
): string {
  const tags = isDiary ? ['日记'] : ['笔记']
  const category = isDiary ? '日记' : '未分类'
  const diaryLine = isDiary ? 'diary: true\n' : ''

  return `---\n` +
    `title: ${quoteYaml(title)}\n` +
    `date: ${date}\n` +
    `updated: ${date}\n` +
    `description: ${quoteYaml(description || '待补充摘要')}\n` +
    `tags:\n` +
    tags.map((tag) => `  - ${quoteYaml(tag)}`).join('\n') +
    `\n` +
    `category: ${quoteYaml(category)}\n` +
    diaryLine +
    `private: false\n` +
    `stars: 0\n` +
    `forks: 0\n` +
    `---\n\n` +
    `# ${title}\n\n` +
    `在这里开始写作。\n`
}

function toPageUrlFromFile(sourceFile: string): string {
  return '/' + sourceFile.replace(/\.md$/, '')
}

async function onCreatePost() {
  if (creatingPost.value) return

  const title = newPostForm.title.trim()
  if (!title) {
    setStatus('请先填写标题。', 'error')
    return
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(newPostForm.date)
    ? newPostForm.date
    : new Date().toISOString().slice(0, 10)

  const preferredSlug = slugify(newPostForm.slug || title)
  const slug = preferredSlug || `post-${Date.now()}`
  const sourceFile = `posts/${slug}.md`

  if (allPages.some((page) => page.sourceFile === sourceFile)) {
    setStatus('同名文章已存在，请更换 slug。', 'error')
    return
  }

  creatingPost.value = true
  const isDiary = managerScope.value === 'diary'
  const content = buildPostContent(title, date, newPostForm.description.trim(), isDiary)
  const url = toPageUrlFromFile(sourceFile)

  try {
    const localWritten = await writeTextToFile(sourceFile, content)

    if (hasGitHubSync.value) {
      await upsertGitHubFile(
        sourceFile,
        encodeTextBase64(content),
        buildCommitMessage(sourceFile, 'create markdown')
      )
    } else if (!localWritten) {
      downloadMarkdown(sourceFile, content)
      setStatus('环境不支持写盘，已下载新文章 Markdown。', 'info')
    }

    const page: EditablePageItem = {
      url,
      source: content,
      sourceFile
    }
    allPages.push(page)
    pageByPath.set(normalizePath(url), page)
    resetNewPostForm()
    setStatus('文章已创建。', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    setStatus(`创建失败：${message}`, 'error')
  } finally {
    creatingPost.value = false
  }
}

async function onDeletePost(page: EditablePageItem) {
  const confirmed = window.confirm(`确认删除文章 ${page.sourceFile} 吗？`)
  if (!confirmed) return

  try {
    await deleteFileIfExists(page.sourceFile)

    if (hasGitHubSync.value) {
      await deleteGitHubFile(page.sourceFile, buildCommitMessage(page.sourceFile, 'remove markdown'))
    }

    const index = allPages.findIndex((item) => item.sourceFile === page.sourceFile)
    if (index >= 0) allPages.splice(index, 1)
    pageByPath.delete(normalizePath(page.url))

    if (editingPage.value?.sourceFile === page.sourceFile) {
      leaveEditMode()
    }

    if (normalizePath(route.path) === normalizePath(page.url)) {
      const base = site.value.base || '/'
      window.location.href = `${base.replace(/\/$/, '')}/posts/`
    }

    setStatus('文章已删除。', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    setStatus(`删除失败：${message}`, 'error')
  }
}

function onOpenPost(page: EditablePageItem) {
  const base = site.value.base || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const path = page.url.startsWith('/') ? page.url : `/${page.url}`
  window.location.href = `${normalizedBase}${path}`
}

async function onExitEditMode() {
  if (!isEditorOpen.value) return
  await persistDraft('退出编辑态自动保存')
  leaveEditMode()
}

function onEditorActivity() {
  resetIdleTimer()
}

function onEditorInput() {
  resetIdleTimer()
}

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function encodeTextBase64(content: string): string {
  return bytesToBase64(new TextEncoder().encode(content))
}

async function encodeFileBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return bytesToBase64(new Uint8Array(buffer))
}

function extractUploadUrls(markdown: string): Set<string> {
  const urls = new Set<string>()
  const regex = /!\[[^\]]*\]\((\/uploads\/[^)\s]+)\)/g
  let match: RegExpExecArray | null = regex.exec(markdown)

  while (match) {
    urls.add(match[1])
    match = regex.exec(markdown)
  }

  return urls
}

function toUploadRepoPath(url: string): string {
  return `public${url}`
}

function toUploadPublicUrl(fileName: string): string {
  return `/uploads/${fileName}`
}

function toUploadFileName(file: File): string {
  const extMatch = file.name.match(/\.[a-zA-Z0-9]+$/)
  const ext = extMatch ? extMatch[0].toLowerCase() : '.png'
  const base = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'image'
  return `${Date.now()}-${base}${ext}`
}

function openImagePicker() {
  imageInput.value?.click()
}

async function ensureWorkspaceHandle() {
  if (workspaceHandle.value) return workspaceHandle.value
  if (!inBrowser || typeof window.showDirectoryPicker !== 'function') return null

  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    workspaceHandle.value = handle
    return handle
  } catch {
    return null
  }
}

async function writeTextToFile(relativePath: string, content: string) {
  const root = await ensureWorkspaceHandle()
  if (!root) return false

  const segments = relativePath.split('/').filter(Boolean)
  if (segments.length === 0) return false

  let directory = root
  for (const segment of segments.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(segment, { create: true })
  }

  const fileName = segments[segments.length - 1]
  const handle = await directory.getFileHandle(fileName, { create: true })
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
  return true
}

async function writeBinaryToFile(relativePath: string, file: File): Promise<boolean> {
  const root = await ensureWorkspaceHandle()
  if (!root) return false

  const segments = relativePath.split('/').filter(Boolean)
  if (segments.length === 0) return false

  let directory = root
  for (const segment of segments.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(segment, { create: true })
  }

  const fileName = segments[segments.length - 1]
  const handle = await directory.getFileHandle(fileName, { create: true })
  const writable = await handle.createWritable()
  await writable.write(file)
  await writable.close()
  return true
}

async function deleteFileIfExists(relativePath: string): Promise<boolean> {
  const root = await ensureWorkspaceHandle()
  if (!root) return false

  const segments = relativePath.split('/').filter(Boolean)
  if (segments.length === 0) return false

  let directory: FileSystemDirectoryHandle = root

  for (const segment of segments.slice(0, -1)) {
    try {
      directory = await directory.getDirectoryHandle(segment)
    } catch {
      return false
    }
  }

  const fileName = segments[segments.length - 1]
  try {
    await directory.removeEntry(fileName)
    return true
  } catch {
    return false
  }
}

function downloadMarkdown(relativePath: string, content: string) {
  const fileName = relativePath.split('/').pop() || 'article.md'
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function encodeRepoPath(path: string): string {
  return path.split('/').map((segment) => encodeURIComponent(segment)).join('/')
}

function getGitHubContentApiUrl(path: string): string {
  const owner = githubSync.owner.trim()
  const repo = githubSync.repo.trim()
  const encoded = encodeRepoPath(path)
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}`
}

async function githubRequest(
  path: string,
  init: RequestInit = {}
): Promise<any> {
  if (!hasGitHubSync.value) {
    throw new Error('GitHub 同步配置不完整。')
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${githubSync.token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28'
  }

  if (init.body) headers['Content-Type'] = 'application/json'

  const response = await fetch(path, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined)
    }
  })

  if (!response.ok) {
    const message = await response.text()
    throw new GitHubApiError(
      response.status,
      `GitHub API ${response.status}: ${message || '请求失败'}`
    )
  }

  if (response.status === 204) return null
  return response.json()
}

async function getGitHubFileSha(path: string): Promise<string | null> {
  try {
    const branch = encodeURIComponent(githubSync.branch.trim())
    const url = `${getGitHubContentApiUrl(path)}?ref=${branch}`
    const result = await githubRequest(url)
    return result?.sha || null
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) return null
    throw error
  }
}

async function upsertGitHubFile(path: string, base64Content: string, message: string) {
  const sha = await getGitHubFileSha(path)
  const payload: Record<string, string> = {
    message,
    content: base64Content,
    branch: githubSync.branch.trim()
  }

  if (sha) payload.sha = sha

  await githubRequest(getGitHubContentApiUrl(path), {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

async function deleteGitHubFile(path: string, message: string) {
  const sha = await getGitHubFileSha(path)
  if (!sha) return

  const payload = {
    message,
    sha,
    branch: githubSync.branch.trim()
  }

  await githubRequest(getGitHubContentApiUrl(path), {
    method: 'DELETE',
    body: JSON.stringify(payload)
  })
}

function buildCommitMessage(target: string, action: string): string {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
  return `chore(content): ${action} ${target} (${stamp})`
}

async function insertImageFile(file: File) {
  const fileName = toUploadFileName(file)
  const publicUrl = toUploadPublicUrl(fileName)
  const repoPath = toUploadRepoPath(publicUrl)

  let useDataUrl = false
  const wroteLocal = await writeBinaryToFile(repoPath, file)

  if (!wroteLocal && !hasGitHubSync.value) {
    useDataUrl = true
  }

  let imageUrl = publicUrl
  if (useDataUrl) {
    const buffer = await file.arrayBuffer()
    const base64 = bytesToBase64(new Uint8Array(buffer))
    imageUrl = `data:${file.type || 'image/png'};base64,${base64}`
  } else {
    pendingImageUploads.set(publicUrl, { file, repoPath })
  }

  insertAtCursor(`\n![${file.name.replace(/\.[^/.]+$/, '') || 'image'}](${imageUrl})\n`)
  resetIdleTimer()
}

function insertAtCursor(text: string) {
  const textarea = editorTextarea.value
  if (!textarea) {
    editorContent.value += text
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = editorContent.value.slice(0, start)
  const after = editorContent.value.slice(end)
  editorContent.value = `${before}${text}${after}`

  nextTick(() => {
    const pos = start + text.length
    textarea.focus()
    textarea.setSelectionRange(pos, pos)
  })
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    await insertImageFile(file)
    setStatus('图片已插入到 Markdown。', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    setStatus(`图片插入失败：${message}`, 'error')
  } finally {
    input.value = ''
  }
}

async function onEditorPaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items || items.length === 0) {
    resetIdleTimer()
    return
  }

  const imageFiles = Array.from(items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file)

  if (imageFiles.length === 0) {
    resetIdleTimer()
    return
  }

  event.preventDefault()

  for (const file of imageFiles) {
    try {
      await insertImageFile(file)
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      setStatus(`粘贴图片失败：${message}`, 'error')
      break
    }
  }
}

async function persistDraft(reason: string) {
  if (isSaving.value) return
  const page = editingPage.value
  if (!page) return

  isSaving.value = true
  try {
    const previousContent = lastSavedContent.value
    const nextContent = editorContent.value

    const previousUrls = extractUploadUrls(previousContent)
    const nextUrls = extractUploadUrls(nextContent)
    const removedUrls = Array.from(previousUrls).filter((url) => !nextUrls.has(url))

    for (const [url, upload] of pendingImageUploads) {
      if (!nextUrls.has(url) && !previousUrls.has(url)) {
        await deleteFileIfExists(upload.repoPath)
        pendingImageUploads.delete(url)
      }
    }

    let localMdWritten = false
    const markdownChanged = previousContent !== nextContent

    if (markdownChanged) {
      localMdWritten = await writeTextToFile(page.sourceFile, nextContent)
    }

    const pendingReferenced = Array.from(nextUrls).filter((url) =>
      pendingImageUploads.has(url)
    )

    for (const url of pendingReferenced) {
      const upload = pendingImageUploads.get(url)
      if (!upload) continue

      await writeBinaryToFile(upload.repoPath, upload.file)

      if (hasGitHubSync.value) {
        const base64 = await encodeFileBase64(upload.file)
        await upsertGitHubFile(
          upload.repoPath,
          base64,
          buildCommitMessage(upload.repoPath, 'upload image')
        )
      }

      pendingImageUploads.delete(url)
    }

    for (const url of removedUrls) {
      const repoPath = toUploadRepoPath(url)
      await deleteFileIfExists(repoPath)

      if (hasGitHubSync.value) {
        await deleteGitHubFile(repoPath, buildCommitMessage(repoPath, 'remove image'))
      }

      pendingImageUploads.delete(url)
    }

    if (markdownChanged && hasGitHubSync.value) {
      await upsertGitHubFile(
        page.sourceFile,
        encodeTextBase64(nextContent),
        buildCommitMessage(page.sourceFile, 'update markdown')
      )
    }

    if (markdownChanged && !localMdWritten && !hasGitHubSync.value) {
      downloadMarkdown(page.sourceFile, nextContent)
      setStatus('当前环境不支持写盘，已下载 Markdown 文件。', 'info')
    }

    page.source = nextContent
    lastSavedContent.value = nextContent

    const changedCount =
      (markdownChanged ? 1 : 0) +
      pendingReferenced.length +
      removedUrls.length

    if (changedCount > 0) {
      setStatus(`${reason}完成，已更新 Markdown 与图片。`, 'success')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    setStatus(`保存失败：${message}`, 'error')
  } finally {
    isSaving.value = false
  }
}

async function onManualSave() {
  await persistDraft('手动保存')
}

onMounted(() => {
  if (!inBrowser) return
  window.addEventListener('ghx-open-md-editor', onOpenEditorEvent)
  window.addEventListener('ghx-open-post-manager', onOpenPostManagerEvent as EventListener)
})

onUnmounted(() => {
  if (!inBrowser) return
  window.removeEventListener('ghx-open-md-editor', onOpenEditorEvent)
  window.removeEventListener(
    'ghx-open-post-manager',
    onOpenPostManagerEvent as EventListener
  )
  clearIdleTimer()
  if (statusTimer !== null) window.clearTimeout(statusTimer)
})
</script>

<template>
  <div class="ghx-admin-layer">
    <div
      v-if="statusMessage"
      class="ghx-admin-status"
      :class="`is-${statusType}`"
    >
      {{ statusMessage }}
    </div>

    <div v-if="isAuthModalOpen" class="ghx-admin-mask" @click.self="closeAuthModal">
      <form class="ghx-admin-auth" @submit.prevent="submitAuth">
        <h3>管理员验证</h3>
        <p>请输入密码以进入编辑模式</p>
        <input
          v-model="password"
          type="password"
          autocomplete="off"
          placeholder="输入密码"
        />
        <p v-if="authError" class="ghx-admin-auth__error">{{ authError }}</p>
        <div class="ghx-admin-auth__actions">
          <button
            type="button"
            class="ghx-admin-btn ghx-admin-btn--ghost"
            @click="closeAuthModal"
          >
            取消
          </button>
          <button type="submit" class="ghx-admin-btn">确认</button>
        </div>
      </form>
    </div>

    <div v-if="isEditorOpen" class="ghx-admin-mask ghx-admin-mask--editor" @click.self="onExitEditMode">
      <section class="ghx-admin-editor">
        <header class="ghx-admin-editor__header">
          <h3>Markdown 编辑器</h3>
          <p>{{ editingPage?.sourceFile }}</p>
        </header>

        <textarea
          ref="editorTextarea"
          v-model="editorContent"
          class="ghx-admin-editor__textarea"
          spellcheck="false"
          @input="onEditorInput"
          @keydown="onEditorActivity"
          @paste="onEditorPaste"
        />

        <div class="ghx-admin-editor__actions">
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="ghx-admin-editor__file"
            @change="onImageSelected"
          />
          <button
            type="button"
            class="ghx-admin-btn ghx-admin-btn--ghost"
            @click="openImagePicker"
          >
            上传图片
          </button>
          <button type="button" class="ghx-admin-btn" :disabled="isSaving" @click="onManualSave">
            {{ isSaving ? '保存中...' : '保存 Markdown' }}
          </button>
          <button
            type="button"
            class="ghx-admin-btn ghx-admin-btn--ghost"
            :disabled="isSaving"
            @click="onExitEditMode"
          >
            退出编辑态
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="isPostManagerOpen"
      class="ghx-admin-mask"
      @click.self="isPostManagerOpen = false"
    >
      <section class="ghx-admin-manager">
        <header class="ghx-admin-manager__header">
          <h3>{{ managerScope === 'diary' ? '日记管理' : '文章管理' }}</h3>
          <button
            type="button"
            class="ghx-admin-btn ghx-admin-btn--ghost"
            @click="isPostManagerOpen = false"
          >
            关闭
          </button>
        </header>

        <div class="ghx-admin-manager__create">
          <input v-model="newPostForm.title" type="text" placeholder="新文章标题" />
          <input v-model="newPostForm.slug" type="text" placeholder="slug（可选）" />
          <input v-model="newPostForm.date" type="date" />
          <input v-model="newPostForm.description" type="text" placeholder="摘要（可选）" />
          <button type="button" class="ghx-admin-btn" :disabled="creatingPost" @click="onCreatePost">
            {{ creatingPost ? '创建中...' : '新增文章' }}
          </button>
        </div>

        <div class="ghx-admin-manager__list">
          <article
            v-for="page in managedPosts"
            :key="page.sourceFile"
            class="ghx-admin-manager__item"
          >
            <div class="ghx-admin-manager__meta">
              <strong>{{ page.sourceFile }}</strong>
              <span>{{ page.url }}</span>
            </div>
            <div class="ghx-admin-manager__actions">
              <button
                type="button"
                class="ghx-admin-btn ghx-admin-btn--ghost"
                @click="onOpenPost(page)"
              >
                打开
              </button>
              <button
                type="button"
                class="ghx-admin-btn ghx-admin-btn--danger"
                @click="onDeletePost(page)"
              >
                删除
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
