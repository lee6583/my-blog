import { defineConfig } from 'vitepress'
import { set_sidebar } from './utils/auto_sidebar.mjs'  // 同级 utils 目录

export default defineConfig({
  base: "/my-blog/",
  head: [
  // 网站图标
  ["link", { rel: "icon", href: "/logo.png" }],
      // 自动加载不蒜子统计脚本（仅在正式站点启用）
    [
      "script",
      {},
      `
      (function() {
        // 只在 GitHub Pages 正式地址下加载不蒜子脚本
        if (typeof location === 'undefined') return;
        var isProd = location.hostname === 'lee6583.github.io' && location.pathname.startsWith('/my-blog/');
        if (!isProd) {
          console.log('[Busuanzi] skipped (not lee6583.github.io/my-blog/)');
          return;
        }

        // 防止重复加载
        if (document.getElementById('busuanzi-script')) return;

        var bs = document.createElement('script');
        bs.id = 'busuanzi-script';
        bs.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
        bs.async = true;
        bs.onload = function() {
          console.log('[Busuanzi] script loaded on production');
        };
        document.body.appendChild(bs);
      })();
      `
    ]
  ],



  title: '知识博客',
  description: 'A VitePress Site',
  themeConfig: {
    outlineTitle: '目录',
    outline: [2, 6],
    logo: '/博客.svg', 

    // 顶部导航
    nav: [
      { text: '技术书籍', link: 'https://github.com/lee6583' },
      { text: '算法', link: '/front-end/react/' },
      {
        text: '前端',
        items: [
          {
            text:'技术栈',
            items:[
            { 
             text: '<span style="display:inline-flex;align-items:center;"><img src="/html.svg" style="width:16px;height:16px;margin-right:6px;">HTML</span>',
             link:"/"
            },
            { 
             text: '<span style="display:inline-flex;align-items:center;"><img src="/css.svg" style="width:16px;height:16px;margin-right:6px;">CSS</span>',
             link: '/front-end/react/index.md' 
            },
            { 
             text: '<span style="display:inline-flex;align-items:center;"><img src="/js.svg" style="width:16px;height:16px;margin-right:6px;">JavaScript</span>',
             link: '/markdown-examples' 
            },
            { 
             text: '<span style="display:inline-flex;align-items:center;"><img src="/typescript.svg" style="width:16px;height:16px;margin-right:6px;">TypeScript</span>',
             link: '/markdown-examples' 
            },
           ],
          },
        ]
      },
      { text: '后端', link: '/backend/rabbitmq/' },
      { text: '计算机知识', link: '/backend/rabbitmq/' },
      { text: 'AI', link: '/两边栏演示' },
      {
        text: '项目',
        items: [
          { text: '首页', link: '/' },
          { text: 'markdown 示例', link: '/markdown-examples' },
        ],
      },
    ],

    // 侧边栏（key 以 / 结尾；传参不要以 / 开头）
    // sidebar: {
    //   '/front-end/react/': set_sidebar('front-end/react'),
    //   '/backend/rabbitmq/': set_sidebar('backend/rabbitmq'),
    // },
    sidebar:false,
    aside:"left",

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
      {
        icon: {
           svg:'<svg t="1758109234512" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4491" width="200" height="200"><path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z" fill="#C71D23" p-id="4492"></path></svg>'
        },
        link: "https://gitee.com/lee6583",
      },
    ],
    footer: {
      copyright: 'Copyright © 2025 lee6583'
    },
    // 设置搜索框的样式
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    },
  },   
})