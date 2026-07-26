# gzdyj-blog 站点架构 / Site Architecture

---

## 中文版

### 概述

这是一个基于 **Astro 7** + **Firefly 主题** 的个人博客，运行**中英双站**。同一套代码仓库通过构建时环境变量控制输出不同语言版本的站点。

| 站点 | 域名 | CDN | 构建命令 |
|------|------|-----|---------|
| 中文站 | blog.zinzin.cc | 又拍云 CDN | `pnpm build:zh` |
| 英文站 | blog.zinzin.top | Cloudflare Pages | `pnpm build:en` |

### 核心机制

**1. 构建语言控制**

通过 `PUBLIC_BUILD_LANG` 环境变量控制：
- `zh` → 构建中文站，siteConfig.lang 输出 `zh_CN`
- `en` → 构建英文站，siteConfig.lang 输出 `en`
- 未设置（开发模式）→ 显示所有语言

**2. 文章过滤**

所有文章在 `src/content/posts/` 下，英文文章以 `-en.md` 后缀命名（如 `acme-wildcard-ssl-en.md`）。frontmatter 中的 `lang` 字段决定文章归属。构建时 `content-utils.ts` 的 `postFilter()` 根据 `PUBLIC_BUILD_LANG` 只保留对应语言的文章。

**3. 配置语言感知**

关键配置模块根据构建语言动态切换输出内容：
- `siteConfig.ts` — 标题、URL、描述、关键词（`overridesByLang` 对象）
- `navBarConfig.ts` — 导航标签通过 `t(zh, en)` 函数切换
- `profileConfig.ts` — bio 字段按语言输出
- `announcementConfig.ts` — 公告内容按语言切换
- `Footer.astro` — 又拍云 logo 仅中文站显示
- `FooterConfig.html` — ICP 备案仅中文站显示

**4. 国际化（i18n）**

`src/i18n/` 目录维护多语言 UI 翻译文件（en, zh_CN, zh_TW, ja, ko, ru），用于界面文字而非文章内容。

**5. 导航栏语言切换**

`Navbar.astro` 根据 `siteConfig.lang` 判断：
- `zh_CN` → 显示 "EN" 按钮，链接到 `blog.zinzin.top`
- `en` → 显示 "中文" 按钮，链接到 `blog.zinzin.cc`

### 部署流程

GitHub Actions 工作流（`.github/workflows/deploy.yml`）在推送 `main` 分支时自动触发：

**中文站部署**：
1. 安装依赖 → `pnpm install`
2. 构建中文站 → `pnpm build:zh`（设 `PUBLIC_BUILD_LANG=zh`）
3. S3 同步 → `aws s3 sync` 上传 `dist/` 到又拍云对象存储
4. CDN 缓存刷新 → 调用又拍云 purge API 刷新首页和 about 页面

**英文站部署**：
1. 安装依赖 → `pnpm install`
2. 构建英文站 → `pnpm build:en`（设 `PUBLIC_BUILD_LANG=en`）
3. 部署 → cloudflare/wrangler-action 上传到 Cloudflare Pages

**并发控制**：
- `concurrency.group: "pages"` + `cancel-in-progress: true`
- 新推送自动取消正在运行的旧 workflow，避免排队积压

### GitHub Secrets 需求

| Secret | 用途 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `YOUPAI_ACCESSKEY` | 又拍云 S3 Access Key |
| `YOUPAI_SECRETACCESSKEY` | 又拍云 S3 Secret Key |
| `YOUPAI_BUCKET` | 又拍云存储桶名 |
| `YOUPAI_OPERATOR` | 又拍云操作员名 |
| `YOUPAI_OPERATOR_PWD` | 又拍云操作员密码（用于部署后自动刷新 CDN 缓存） |

### 本地开发

```bash
pnpm dev          # 启动开发服务器（显示所有语言）
pnpm build:zh     # 构建中文站
pnpm build:en     # 构建英文站
pnpm format       # Biome 格式化
pnpm lint         # Biome 检查
pnpm type-check   # TypeScript 类型检查
```

---

## English Version

### Overview

This is a personal blog built with **Astro 7** + the **Firefly** theme, running as a **bilingual site (Chinese + English)**. Both sites share the same codebase, with the build output controlled by an environment variable.

| Site | Domain | CDN | Build Command |
|------|--------|-----|---------------|
| Chinese | blog.zinzin.cc | Upyun CDN | `pnpm build:zh` |
| English | blog.zinzin.top | Cloudflare Pages | `pnpm build:en` |

### Core Mechanism

**1. Build Language Control**

Controlled via the `PUBLIC_BUILD_LANG` environment variable:
- `zh` → Build Chinese site (`siteConfig.lang` = `zh_CN`)
- `en` → Build English site (`siteConfig.lang` = `en`)
- Unset (dev mode) → Show all content

**2. Post Filtering**

All posts live in `src/content/posts/`. English posts are suffixed with `-en.md` (e.g. `acme-wildcard-ssl-en.md`). The `lang` frontmatter field determines which site a post belongs to. During build, `postFilter()` in `content-utils.ts` filters posts by the current build language.

**3. Language-Aware Configuration**

Key config modules switch content based on the build language:
- `siteConfig.ts` — Title, URL, description, keywords (via `overridesByLang` object)
- `navBarConfig.ts` — Nav labels use the `t(zh, en)` helper function
- `profileConfig.ts` — Bio field is language-aware
- `announcementConfig.ts` — Announcement content switches by language
- `Footer.astro` — Upyun logo only on Chinese site
- `FooterConfig.html` — ICP filing only on Chinese site

**4. i18n**

`src/i18n/` contains UI translation files (en, zh_CN, zh_TW, ja, ko, ru) for interface text, not for post content.

**5. Navbar Language Switcher**

`Navbar.astro` checks `siteConfig.lang`:
- `zh_CN` → Shows "EN" link pointing to `blog.zinzin.top`
- `en` → Shows "中文" link pointing to `blog.zinzin.cc`

### Deployment

A GitHub Actions workflow (`.github/workflows/deploy.yml`) runs automatically on pushes to `main`:

**Chinese Site**:
1. `pnpm install` → Install dependencies
2. `pnpm build:zh` → Build (`PUBLIC_BUILD_LANG=zh`)
3. `aws s3 sync` → Upload `dist/` to Upyun object storage
4. Upyun purge API → Refresh CDN cache for homepage and about page

**English Site**:
1. `pnpm install` → Install dependencies
2. `pnpm build:en` → Build (`PUBLIC_BUILD_LANG=en`)
3. `cloudflare/wrangler-action` → Deploy to Cloudflare Pages

**Concurrency**:
- `concurrency.group: "pages"` + `cancel-in-progress: true`
- New pushes automatically cancel in-progress runs, avoiding queue backlog.

### GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `YOUPAI_ACCESSKEY` | Upyun S3 Access Key |
| `YOUPAI_SECRETACCESSKEY` | Upyun S3 Secret Key |
| `YOUPAI_BUCKET` | Upyun bucket name |
| `YOUPAI_OPERATOR` | Upyun operator name |
| `YOUPAI_OPERATOR_PWD` | Upyun operator password (for CDN cache purge) |

### Local Development

```bash
pnpm dev          # Start dev server (shows all languages)
pnpm build:zh     # Build Chinese site
pnpm build:en     # Build English site
pnpm format       # Biome format
pnpm lint         # Biome lint
pnpm type-check   # TypeScript type check
```
