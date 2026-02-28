import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/my-blog/',
  title: 'Lee Notes',
  description: 'GitHub Profile Overview style VitePress blog',
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/logo.png' }]],
  themeConfig: {
    logo: '/博客.svg',
    nav: [
      { text: '概述', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '标签', link: '/tags/' },
      { text: '项目', link: '/projects/' },
      { text: '日记', link: '/diary/' },
      { text: '关于', link: '/about/' }
    ],
    sidebar: false,
    aside: 'left',
    outline: { level: 'deep', label: '' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/lee6583' }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文章',
            buttonAriaLabel: '搜索文章'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    }
  }
})
