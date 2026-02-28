<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { data as posts } from '../../../posts.data'
import type { PostItem } from '../../../posts.data'
import RepoArticleCard from './RepoArticleCard.vue'
import { toTimestamp } from '../utils/posts'
import PostManagerButton from './PostManagerButton.vue'

const currentPage = ref(1)
const viewportWidth = ref(1280)

const diaryPosts = computed(() =>
  (posts as PostItem[])
    .filter((post) => post.isDiary)
    .slice()
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
)

const columns = computed(() => {
  if (viewportWidth.value >= 1181) return 3
  if (viewportWidth.value >= 769) return 2
  return 1
})

const rowsPerPage = computed(() => (viewportWidth.value >= 769 ? 4 : 5))
const pageSize = computed(() => columns.value * rowsPerPage.value)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(diaryPosts.value.length / pageSize.value))
)

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return diaryPosts.value.slice(start, start + pageSize.value)
})

watch([pageSize, totalPages], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
})

function goToPage(page: number) {
  const p = Math.max(1, Math.min(page, totalPages.value))
  currentPage.value = p
}

function updateViewportWidth() {
  if (typeof window === 'undefined') return
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<template>
  <div class="ghx-page">
    <section class="ghx-page__content">
      <header class="ghx-page__header">
        <h1>日记</h1>
        <div class="ghx-page__header-actions">
          <PostManagerButton scope="diary" />
        </div>
      </header>

      <div class="ghx-grid ghx-grid--diary">
        <RepoArticleCard
          v-for="post in paginatedPosts"
          :key="post.url"
          :post="post"
        />
      </div>

      <nav
        v-if="totalPages > 1"
        class="ghx-feed__pagination ghx-feed__pagination--diary"
        aria-label="日记分页"
      >
        <button
          type="button"
          class="ghx-feed__pagination-btn"
          :disabled="currentPage <= 1"
          aria-label="上一页"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        <template v-for="p in totalPages" :key="p">
          <button
            type="button"
            class="ghx-feed__pagination-btn"
            :class="{ 'is-active': p === currentPage }"
            :aria-label="`第 ${p} 页`"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
        </template>
        <button
          type="button"
          class="ghx-feed__pagination-btn"
          :disabled="currentPage >= totalPages"
          aria-label="下一页"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </nav>

      <p v-if="diaryPosts.length === 0" class="ghx-page__empty">暂无日记内容</p>
    </section>
  </div>
</template>
