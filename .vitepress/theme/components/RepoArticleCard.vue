<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { PostItem } from '../../../posts.data'
import { categoryColor } from '../utils/posts'

const props = defineProps<{
  post: PostItem
}>()

const badgeText = computed(() => (props.post.private ? '私密' : '公开'))
const createdDate = computed(() => props.post.date)
const dotColor = computed(() => categoryColor(props.post.category))
</script>

<template>
  <article class="ghx-card">
    <div class="ghx-card__top">
      <a class="ghx-card__title" :href="withBase(post.url)">{{ post.title }}</a>
      <span class="ghx-card__badge" :class="{ private: post.private }">
        {{ badgeText }}
      </span>
    </div>

    <p class="ghx-card__desc">{{ post.description }}</p>

    <div class="ghx-card__meta">
      <span class="ghx-meta ghx-meta--category">
        <span class="ghx-dot" :style="{ backgroundColor: dotColor }" />
        {{ post.category }}
      </span>
      <time class="ghx-meta ghx-meta--date" :datetime="post.date">
        创建于 {{ createdDate }}
      </time>
    </div>
  </article>
</template>
