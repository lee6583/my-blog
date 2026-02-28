<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as posts } from '../../../posts.data'
import type { PostItem } from '../../../posts.data'
import RepoArticleCard from './RepoArticleCard.vue'
import PostManagerButton from './PostManagerButton.vue'

const selectedDate = ref('')

const filteredPosts = computed(() => {
  if (!selectedDate.value) return posts as PostItem[]
  const date = selectedDate.value
  return (posts as PostItem[]).filter(
    (p) => p.date === date || p.updated === date
  )
})
</script>

<template>
  <div class="ghx-page">
    <section class="ghx-page__content">
      <header class="ghx-page__header">
        <h1>文章</h1>
        <div class="ghx-page__header-actions">
          <input
            v-model="selectedDate"
            type="date"
            class="ghx-page__date-input"
            aria-label="选择日期筛选文章"
          />
          <PostManagerButton scope="posts" />
        </div>
      </header>

      <div class="ghx-grid">
        <RepoArticleCard
          v-for="post in filteredPosts"
          :key="post.url"
          :post="post"
        />
      </div>
      <p v-if="filteredPosts.length === 0" class="ghx-page__empty">
        该日期暂无文章
      </p>
    </section>
  </div>
</template>
