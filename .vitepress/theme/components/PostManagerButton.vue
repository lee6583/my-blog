<script setup lang="ts">
import { inBrowser } from 'vitepress'
import { useAdminMode } from '../composables/admin'

const props = withDefaults(
  defineProps<{
    scope?: 'posts' | 'diary'
  }>(),
  {
    scope: 'posts'
  }
)

const { isAdminMode, openAuthModal } = useAdminMode()

function onClick() {
  if (!isAdminMode.value) {
    openAuthModal()
    return
  }
  if (!inBrowser) return
  window.dispatchEvent(
    new CustomEvent('ghx-open-post-manager', { detail: { scope: props.scope } })
  )
}
</script>

<template>
  <button type="button" class="ghx-page__edit-btn" @click="onClick">
    编辑
  </button>
</template>
