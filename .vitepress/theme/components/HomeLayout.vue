<template>
  <div class="gh-home">
    <aside class="gh-left">
      <div class="gh-profile-card">
        <img src="/programmer.png" alt="个人头像" class="gh-avatar" />

        <div class="gh-profile-main">
          <h1 class="gh-name">lee6583</h1>
          <p class="gh-bio">
            前端 / 全栈开发者，热爱分享技术与学习笔记，记录从基础到实战的每一步成长。
          </p>

          <button class="gh-edit-btn" type="button">
            编辑个人资料
          </button>

          <p class="gh-follow">
            只 1 位 关注者 · 2 位 关注
          </p>
        </div>
      </div>
    </aside>

    <main class="gh-right">
      <nav class="gh-tabs">
        <button class="gh-tab gh-tab--active" type="button">概述</button>
        <button class="gh-tab" type="button">前端</button>
        <button class="gh-tab" type="button">后端</button>
        <button class="gh-tab" type="button">计算机基础</button>
        <button class="gh-tab" type="button">AI</button>
      </nav>

      <section class="gh-section">
        <header class="gh-section-header">
          <h2 class="gh-section-title">精选文章</h2>
          <span class="gh-section-subtitle">最近在看的 / 写的内容</span>
        </header>

        <div class="gh-card-grid">
          <a class="gh-card" href="/api-examples">
            <h3 class="gh-card-title">个人心得</h3>
            <p class="gh-card-desc">
              记录学习体会与实践总结，帮助自己持续复盘。
            </p>
            <div class="gh-card-meta">
              <span>随笔</span>
            </div>
          </a>

          <a class="gh-card" href="/markdown-examples">
            <h3 class="gh-card-title">Markdown 示例</h3>
            <p class="gh-card-desc">整理常用 Markdown 语法和排版技巧。</p>
            <div class="gh-card-meta">
              <span>工具</span>
            </div>
          </a>

          <a class="gh-card" href="/backend/rabbitmq/">
            <h3 class="gh-card-title">RabbitMQ 笔记</h3>
            <p class="gh-card-desc">消息队列基础概念与实践代码整理。</p>
            <div class="gh-card-meta">
              <span>后端</span>
            </div>
          </a>

          <a class="gh-card" href="/两边栏演示">
            <h3 class="gh-card-title">AI / 双栏布局演示</h3>
            <p class="gh-card-desc">
              尝试不同排版方式与 AI 相关内容的展示。
            </p>
            <div class="gh-card-meta">
              <span>AI</span>
            </div>
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

