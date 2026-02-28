import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomeGithubLike from './components/HomeGithubLike.vue'
import PostsPage from './components/PostsPage.vue'
import TagsPage from './components/TagsPage.vue'
import DiaryPage from './components/DiaryPage.vue'
import AdminEditorPanel from './components/AdminEditorPanel.vue'
import DocArticleEditButton from './components/DocArticleEditButton.vue'
import './style.css'
import './github-like.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-before': () => h(DocArticleEditButton),
      'layout-bottom': () => h(AdminEditorPanel)
    }),
  enhanceApp({ app }) {
    app.component('HomeGithubLike', HomeGithubLike)
    app.component('PostsPage', PostsPage)
    app.component('TagsPage', TagsPage)
    app.component('DiaryPage', DiaryPage)
  }
} satisfies Theme
