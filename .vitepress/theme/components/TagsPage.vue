<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as posts } from '../../../posts.data'
import RepoArticleCard from './RepoArticleCard.vue'

const selectedTag = ref('全部')

const tagStats = computed(() => {
  const counts = new Map<string, number>()
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-Hans-CN'))
})

const filteredPosts = computed(() => {
  if (selectedTag.value === '全部') return posts
  return posts.filter((post) => post.tags.includes(selectedTag.value))
})
</script>

<template>
  <div class="ghx-page">
    <section class="ghx-page__content">
      <header class="ghx-page__header">
        <h1>标签</h1>
      </header>

      <div class="ghx-tags">
        <button
          class="ghx-tag"
          :class="{ active: selectedTag === '全部' }"
          type="button"
          @click="selectedTag = '全部'"
        >
          全部 ({{ posts.length }})
        </button>

        <button
          v-for="tag in tagStats"
          :key="tag.name"
          class="ghx-tag"
          :class="{ active: selectedTag === tag.name }"
          type="button"
          @click="selectedTag = tag.name"
        >
          {{ tag.name }} ({{ tag.count }})
        </button>
      </div>

      <div class="ghx-grid">
        <RepoArticleCard
          v-for="post in filteredPosts"
          :key="post.url"
          :post="post"
        />
      </div>
    </section>
  </div>
</template>
