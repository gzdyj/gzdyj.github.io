---
title: "OpenCode 踩坑记：用 stealth-chrome MCP 接管真浏览器"
published: 2026-07-29
description: "Google Search Console 权限管理这种破事，让 AI 帮我点几下不就完了？然后就被教做人了。"
tags: [OpenCode, MCP, Chrome]
category: 工具
lang: "zh"
---

## 背景

前几天要给新搭的两个博客站（一个中文一个英文）加 Google Search Console 的权限，顺便把服务账号也加进去。就一个"添加用户"的操作，想着让 OpenCode 帮我自动化算了。

结果 `browser-control` MCP 打开的无头浏览器直接被 Google 弹了验证码。换 Puppeteer ？还是弹。换 Playwright  stealth ？一样。

搞了半小时，突然反应过来：**我 Chrome 里本来就登录着 Google，为什么非要自己新开一个？**

## 解决方案：stealth-chrome MCP

思路摊开就很简单：**不自己开浏览器，接管已经在用的那个**。

Chrome DevTools Protocol (CDP) 本来就是干这个的。你的登录态、Cookie、扩展——全都不用管，直接用。

我用 `chrome-launcher` 写了个几十行的 MCP Server，把 CDP 包了一层，注册到 OpenCode 的 MCP 配置里：

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "mcp": {
    "stealth-chrome": {
      "type": "local",
      "command": [
        "node",
        "/path/to/stealth-mcp-server.mjs"
      ],
      "enabled": true,
      "description": "真实 Chrome 接管，持久会话"
    }
  }
}
```

然后把原来的 `browser-control` 删掉，只留这一个。

连上之后效果立竿见影——Search Console 直接打开就是登录状态，什么验证码都没有。跟手动操作浏览器一样顺手。

## 踩坑实录

当然，这过程也不是一帆风顺。记录五个真踩过的坑。

### 1. 按钮点了没反应

Search Console 的"添加用户"按钮，用 `stealth-chrome_click` 点上去页面就跳转了。我一开始以为是 bug，重试了好几次，每次都跳到不相关的页面。

最后用 `stealth-chrome_evaluate` 执行 JS 的 `element.click()`，对话框正常弹出来了。

**结论：** SPA 里的事件绑定，用 JS 直接 click 比模拟点击可靠得多。click 点不动的，试试 evaluate。

### 2. Ref 编号会变

每次页面渲染完，元素的 ref 编号（如 e42、e106）都可能变。同一个页面导航回来再 snapshot，ref 全不一样了。

第一次踩到这个的时候我还以为自己记错了。

**结论：** 如果要跨多次操作同一个页面，别硬编码 ref，用 JS 选择器定位元素更稳。

### 3. 选错了 dialog

Search Console 页面里两个 `[role="dialog"]`——侧边导航栏一个、弹窗一个。`document.querySelector('[role="dialog"]')` 每次都拿到侧边栏那个。

**结论：** 用 `document.querySelectorAll(...)` 取最后一个。

### 4. 设了 input.value 但 SPA 没反应

用 `input.value = 'xxx'` 填完邮箱，点"添加"，提示"请输入有效的邮箱地址"。明明填入的地址是完整的，页面却不认。

因为 SPA 框架监听的是 `input` 事件，直接设 value 不会触发。要手动 dispatch：

```js
input.value = 'blog-seo@xxx.iam.gserviceaccount.com';
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new Event('change', { bubbles: true }));
```

### 5. 链接跳不跳不由你

Search Console 的设置页面里，"用户和权限"看起来是个可点文字，结果点下去直接跳到索引页了——它是个真的 `<a href="...">` 链接，不是 SPA 路由。

**结论：** 点之前先 inspect 一下 `a.href` 的值，确定是路由跳转还是就地展开。

## 可用工具一览

最终我实际用到的就这几个：

| 工具 | 用在哪 |
|------|--------|
| `stealth-chrome_navigate` | 跳转到目标页面 |
| `stealth-chrome_snapshot` | 看当前页面上有什么能点的 |
| `stealth-chrome_click` | 点简单按钮 |
| `stealth-chrome_evaluate` | 执行 JS（踩坑时的主力） |
| `stealth-chrome_screenshot` | 截图确认状态 |

## 适用场景

凡是需要已登录才能操作的网站——Search Console、Cloudflare Dashboard、Gmail——stealth-chrome 都能搞定。浏览器开着就行。

## 总结

stealth-chrome MCP 的价值就一句话：**别跟浏览器验证作对，用你已经登录好的那个**。

配置一次、常驻后台、随便折腾。反正 Chrome 别关就行。
