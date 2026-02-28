<script setup lang="ts">
import { computed } from 'vue'
import { inBrowser, useData, useRoute } from 'vitepress'
import { useAdminMode } from '../composables/admin'

const route = useRoute()
const { site } = useData()
const { isAdminMode, openAuthModal } = useAdminMode()

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

const isPostArticle = computed(() => {
  const path = normalizePath(route.path)
  return path.startsWith('/posts/') && path !== '/posts'
})

function onEditClick() {
  if (!isAdminMode.value) {
    openAuthModal()
    return
  }
  if (!inBrowser) return
  window.dispatchEvent(new CustomEvent('ghx-open-md-editor'))
}
</script>

<template>
  <div v-if="isPostArticle" class="ghx-doc-edit-wrap">
    <button type="button" class="ghx-doc-edit-btn" @click="onEditClick">
      编辑
    </button>
  </div>
</template>
