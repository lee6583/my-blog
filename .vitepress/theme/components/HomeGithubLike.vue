<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as posts } from '../../../posts.data'
import type { PostItem } from '../../../posts.data'
import RepoArticleCard from './RepoArticleCard.vue'
import WordsHeatmap, { type DayWords } from './WordsHeatmap.vue'
import { withBase } from 'vitepress'
import wordsByDay from '../../words-by-day.json'
import { useAdminMode } from '../composables/admin'

const PAGE_SIZE = 8
const currentPage = ref(1)

const sortedPosts = computed(() =>
  (posts as PostItem[]).filter((post) => !post.isDiary)
)
const avatarUrl = withBase('/programmer.png')

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedPosts.value.length / PAGE_SIZE))
)

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedPosts.value.slice(start, start + PAGE_SIZE)
})

function goToPage(page: number) {
  const p = Math.max(1, Math.min(page, totalPages.value))
  currentPage.value = p
}

const heatmapData = computed<DayWords[]>(() => wordsByDay as DayWords[])

const { isAdminMode, openAuthModal, exitAdminMode } = useAdminMode()
const editLabel = computed(() => (isAdminMode.value ? '退出' : '编辑'))

function onEditClick() {
  if (!isAdminMode.value) {
    openAuthModal()
    return
  }
  exitAdminMode()
}
</script>

<template>
  <div class="ghx-home">
    <section class="ghx-home__content">
      <aside class="ghx-profile">
        <img class="ghx-profile__avatar" :src="avatarUrl" alt="avatar" />
        <h1 class="ghx-profile__name">Mr.Fan</h1>
        <p class="ghx-profile__bio">
          前端 / 算法 / 工程化学习者。这里记录技术文章与日常思考，保持稳定输出与持续迭代。
        </p>
      </aside>

      <main class="ghx-feed">
        <div class="ghx-feed__card">
          <div class="ghx-feed__header">
            <h2 class="ghx-feed__title">最新文章</h2>
            <div class="ghx-feed__header-actions">
              <a class="ghx-feed__more" :href="withBase('/posts/')">查看全部</a>
              <button
                type="button"
                class="ghx-feed__edit"
                :class="{ 'is-exit': isAdminMode }"
                @click="onEditClick"
              >
                {{ editLabel }}
              </button>
            </div>
          </div>

          <div class="ghx-feed__list">
            <div class="ghx-feed__grid">
              <RepoArticleCard
                v-for="post in paginatedPosts"
                :key="post.url"
                :post="post"
              />
            </div>

            <nav
              v-if="totalPages > 1"
              class="ghx-feed__pagination"
              aria-label="文章分页"
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
          </div>

          <WordsHeatmap :data="heatmapData" start-on="Mon" />
        </div>
      </main>
    </section>
  </div>
</template>
