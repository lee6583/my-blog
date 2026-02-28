---
title: VitePress 首页改造成 GitHub Overview 风格
date: 2026-02-10
updated: 2026-02-26
description: 从默认 Home 到自定义布局，拆分固定 Tabs、Profile 卡片和 repo-card 风格文章网格，形成可复用主题层。
tags:
  - VitePress
  - 前端
  - 工程化
category: 前端
private: false
stars: 27
forks: 5
---

# VitePress 首页改造记录

这篇记录首页重构过程中涉及的结构拆分、数据来源和样式策略，目标是降低后续维护成本。

## 关键策略

- 统一数据来源为 `createContentLoader`
- 卡片字段保持 repo card 信息密度
- 视觉上保持克制，不做过度动画
