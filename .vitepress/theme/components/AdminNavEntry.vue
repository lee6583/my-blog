<script setup lang="ts">
import { inBrowser } from 'vitepress'
import { useAdminMode } from '../composables/admin'

const { isAdminMode, openAuthModal } = useAdminMode()

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
  <div class="ghx-admin-nav-entry">
    <button type="button" class="ghx-admin-nav-btn" @click="onEditClick">
      编辑
    </button>
    <p v-if="isAdminMode" class="ghx-admin-nav-hint">
      管理员模式已开启
    </p>
  </div>
</template>
