# gzdyj-blog — 个人博客（中英双语）

基于 Astro 7 + Firefly 主题的个人博客，**中英双站**，分别部署到不同 CDN。

## 站点结构

| 站点 | 域名 | CDN | 构建命令 |
|------|------|-----|---------|
| 中文站 | `blog.zinzin.cc` | 又拍云 CDN | `pnpm build:zh` |
| 英文站 | `blog.zinzin.top` | Cloudflare Pages | `pnpm build:en` |

两个站点由同一项目构建，通过 `PUBLIC_BUILD_LANG` 环境变量控制构建语言。文章 frontmatter 中的 `lang` 字段决定文章归属。

## 快速命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` / `pnpm start` | 启动本地开发服务器（显示所有语言文章） |
| `pnpm build` | 完整构建（默认中文站） |
| `pnpm build:zh` | 构建中文站（`PUBLIC_BUILD_LANG=zh`） |
| `pnpm build:en` | 构建英文站（`PUBLIC_BUILD_LANG=en`） |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm check` | Astro 诊断检查 |
| `pnpm type-check` | TypeScript 类型检查 (`tsc --noEmit`) |
| `pnpm new-post` | 脚手架生成新文章 |
| `pnpm format` | Biome 格式化 `src/` |
| `pnpm lint` | Biome 检查并自动修复 |

## 目录结构

- **`src/config/`** — 所有站点配置集中在此，改配置首选这里。关键文件：
  - `siteConfig.ts`（标题/URL/主题色）— **语言感知**：根据 `PUBLIC_BUILD_LANG` 动态输出中/英文配置
  - `profileConfig.ts`（头像/签名/社交链接）— bio 字段语言感知
  - `announcementConfig.ts`（公告内容）— 标题/内容按语言切换
  - `navBarConfig.ts`（导航栏配置）— 所有标签按语言切换
  - `commentConfig.ts`（评论系统）
- **`src/content/posts/`** — Markdown 文章。`-en.md` 后缀为英文文章。`lang` frontmatter 控制归属
- **`src/pages/`** — Astro 路由页面
- **`src/components/`** — UI 组件（Astro + Svelte islands）
- **`src/i18n/`** — 国际化翻译文件（en, zh_CN, zh_TW, ja, ko, ru）
- **`src/utils/content-utils.ts`** — 文章查询核心，**按构建语言过滤 post**
- **`.github/workflows/deploy.yml`** — GitHub Actions 双部署工作流

## 写新文章

### 中文文章
```bash
pnpm new-post
# 或手动创建 .md 文件，frontmatter 中加 lang: "zh"
```

### 英文文章
手动在 `src/content/posts/` 下创建 `xxx-en.md` 文件：

```yaml
---
title: "Your Title"
published: 2026-07-23
description: "Your description"
tags: [tag1, tag2]
category: YourCategory
lang: "en"
---
```

文章支持 Markdown 扩展：Admonitions（GitHub/Obsidian/VitePress 风格）、GitHub 仓库卡片、代码高亮（Expressive Code）、Mermaid 图表、KaTeX 数学公式。

## 配置要点

- **`siteConfig.ts`** — 语言感知，中英文站输出不同 `title`/`subtitle`/`site_url`/`description`/`keywords`/`lang`
- **`navBarConfig.ts`** — 所有导航标签通过 `t(zh, en)` 函数按构建语言切换
- **`profileConfig.ts`** — `bio` 字段语言感知
- **`announcementConfig.ts`** — 标题/内容/按钮文字语言感知
- **`FooterConfig.html`** — 自定义 HTML（仅中文站显示 ICP 备案）
- **`Footer.astro`** — 又拍云 logo 仅中文站显示（条件：`siteConfig.lang === "zh_CN"`）

## 构建过滤机制

构建时通过 `PUBLIC_BUILD_LANG` 环境变量控制：
- `zh` → 只显示 `lang: "zh"` 的文章
- `en` → 只显示 `lang: "en"` 的文章
- 未设置（开发模式）→ 显示所有文章

过滤点：
- `src/utils/content-utils.ts` — `postFilter()` 函数
- `src/config/siteConfig.ts` — `overridesByLang` 对象
- `src/config/navBarConfig.ts` — `t()` 函数
- `src/config/profileConfig.ts` — `bio` 字段
- `src/config/announcementConfig.ts` — title/content/text 字段

## 部署

- 推送 `main` 分支 → GitHub Actions 自动触发双部署
- 中文站：`build:zh` → 又拍云存储（S3 兼容 API）
- 英文站：`build:en` → Cloudflare Pages
- GitHub Secrets 需求：
  - `CLOUDFLARE_API_TOKEN` — Cloudflare API Token
  - `YOUPAI_ACCESSKEY` — 又拍云 S3 Access Key
  - `YOUPAI_SECRETACCESSKEY` — 又拍云 S3 Secret Key
  - `YOUPAI_BUCKET` — 又拍云存储桶名
  - `YOUPAI_OPERATOR` — 又拍云操作员名
  - `YOUPAI_OPERATOR_PWD` — 又拍云操作员密码（用于部署后自动刷新 CDN 缓存）

## 编码规范

- Biome 格式化和检查（`biome.json`），使用 tabs 缩进、双引号
- 组件命名：Astro/Svelte 组件 `PascalCase`，配置模块 `camelCase` 且以 `Config` 结尾，工具函数 kebab-case

## 构建注意事项

- `pnpm build` 包含 LQIP 生成、字体子集化、Pagefind 搜索索引，构建时间较长
- 修改字体配置需要先确认字体是否有对应的 `.woff2` 文件或 Astro Font API 提供商
- `src/constants/lqips.json` 和 `src/constants/icons.ts` 是构建产物，`dist/` 同理，不应直接编辑
