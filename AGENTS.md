# gzdyj.github.io — 个人博客

基于 Astro 7 + Firefly 主题的个人博客，通过 GitHub Actions 自动部署到 GitHub Pages。

## 快速命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` / `pnpm start` | 启动本地开发服务器 |
| `pnpm build` | 完整构建：图标 → LQIP → Astro 构建 → 字体子集 → Pagefind 搜索索引 |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm check` | Astro 诊断检查 |
| `pnpm type-check` | TypeScript 类型检查 (`tsc --noEmit`) |
| `pnpm new-post` | 脚手架生成新文章 |
| `pnpm format` | Biome 格式化 `src/` |
| `pnpm lint` | Biome 检查并自动修复 |

## 目录结构

- **`src/config/`** — 所有站点配置集中在此，改配置首选这里。关键文件：`siteConfig.ts`（标题/URL/主题色）、`profileConfig.ts`（头像/签名/社交链接）、`commentConfig.ts`（评论系统）
- **`src/content/posts/`** — Markdown 文章。增删文章后会自动更新首页和归档
- **`src/pages/`** — Astro 路由页面
- **`src/components/`** — UI 组件（Astro + Svelte islands）
- **`.github/workflows/deploy.yml`** — GitHub Actions 部署工作流，推送 `main` 自动构建部署

## 部署

- 推送 `main` 分支 → GitHub Actions 自动构建并部署到 GitHub Pages
- 部署地址：`https://gzdyj.github.io/`
- 构建输出目录：`dist/`（不应手动提交）

## 写新文章

```bash
pnpm new-post
# 或手动在 src/content/posts/ 下创建 .md 文件
```

文章支持 Markdown 扩展：Admonitions（GitHub/Obsidian/VitePress 风格）、GitHub 仓库卡片、代码高亮（Expressive Code）、Mermaid 图表、KaTeX 数学公式。

## 配置要点

所有配置集中在 `src/config/` 目录下，TypeScript 文件。修改后重启 `pnpm dev` 生效。

- 站点信息：`src/config/siteConfig.ts` — 标题、URL、描述、主题色、favicon
- 个人资料：`src/config/profileConfig.ts` — 头像、名字、签名、社交链接
- 评论系统：`src/config/commentConfig.ts` — 支持 Twikoo / Waline / Giscus / Disqus / Artalk
- 主题色：`siteConfig.ts` 中 `themeColor.hue`，范围 0-360
- 导航栏/Logo/页脚：`siteConfig.ts` + `footerConfig.ts`
- 侧边栏布局：`sidebarConfig.ts`

## 编码规范

- Biome 格式化和检查（`biome.json`），使用 tabs 缩进、双引号
- 组件命名：Astro/Svelte 组件 `PascalCase`，配置模块 `camelCase` 且以 `Config` 结尾，工具函数 kebab-case

## 构建注意事项

- `pnpm build` 包含 LQIP 生成、字体子集化、Pagefind 搜索索引，构建时间较长
- 修改字体配置需要先确认字体是否有对应的 `.woff2` 文件或 Astro Font API 提供商
- `src/constants/lqips.json` 和 `src/constants/icons.ts` 是构建产物，`dist/` 同理，不应直接编辑
