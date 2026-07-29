---
title: "Battling Google Search Console with OpenCode: Taking Over a Real Chrome Browser"
published: 2026-07-29
description: "Adding a user in Search Console — one click. Let AI automate it, they said. Then Google slapped me with a captcha."
tags: [OpenCode, MCP, Chrome]
category: Tools
lang: "en"
---

## The Backstory

I had just set up two new blogs (one Chinese, one English) and needed to add them to Google Search Console, then invite a service account as a user. One "Add User" dialog. A couple of clicks. Simple enough.

Let OpenCode automate it, I thought.

The built-in `browser-control` MCP (backed by `playwright-core`) fired up a headless browser, navigated to Search Console, and — captcha. Switched to Puppeteer. Still captcha. Tried Playwright's stealth plugin. Same thing.

After half an hour of banging my head against automation detection, it dawned on me: **My real Chrome was already logged into Google right there on my desktop. Why was I trying to open a new one?**

## The Solution: stealth-chrome MCP

The idea is embarrassingly simple once you say it out loud: **don't spin up a new browser, take over the one that's already running.**

Chrome DevTools Protocol (CDP) exists exactly for this. Your login sessions, cookies, extensions — all of them are already there, no setup needed.

I wrote a ~50-line MCP server using `chrome-launcher`, wrapped the CDP connection, and registered it in OpenCode's MCP config:

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
      "description": "Real Chrome takeover, persistent session"
    }
  }
}
```

Then I removed the old `browser-control` entry entirely.

First connection: Search Console opened already logged in. Zero captchas. Zero friction. It just worked — like I was clicking around myself.

## War Stories

Of course it wasn't all smooth sailing. Here are five real gotchas I hit.

### 1. Click That Wouldn't Click

The "Add User" button in Search Console — clicking it with `stealth-chrome_click` navigated to a completely unrelated page every single time. I retried four times before giving up.

Switched to `stealth-chrome_evaluate` and called `element.click()` from JavaScript. The dialog popped right open.

**Lesson:** SPA event handlers don't always respond to synthesized CDP clicks. When click fails, `evaluate` + native `element.click()` is your fallback.

### 2. Ref IDs Are Ephemeral

Every time you snapshot a page, elements get fresh ref IDs (e42, e106, etc.). Navigate away and back? Different refs.

First time I hit this I thought I was losing my mind.

**Lesson:** Don't hardcode refs across page transitions. Use JS selectors for anything that spans multiple interactions.

### 3. You Picked the Wrong Dialog

Search Console has two `[role="dialog"]` elements on the same page — one for the sidebar nav, one for the actual modal dialog. `document.querySelector('[role="dialog"]')` consistently grabbed the sidebar.

**Lesson:** Use `document.querySelectorAll(...)` and grab the last one.

### 4. Input Value Set, SPA Didn't Care

I set `input.value = 'service-account@...'` and clicked "Add". It told me the email was invalid. The value was clearly there in the DOM.

SPA frameworks listen for `input` events, not property changes. Setting `.value` silently doesn't fire anything.

The fix:

```js
input.value = 'blog-seo@xxx.iam.gserviceaccount.com';
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new Event('change', { bubbles: true }));
```

### 5. Link or Button? Guess.

In Search Console's settings page, "Users and Permissions" looks like something you click to expand a section. Turns out it's an honest-to-god `<a href="...">` link that navigates to a different page entirely.

**Lesson:** Inspect `a.href` before you click. Not everything in a SPA is SPA-routed.

## Tools I Actually Used

| Tool | What For |
|------|----------|
| `stealth-chrome_navigate` | Go to Search Console |
| `stealth-chrome_snapshot` | See what's clickable |
| `stealth-chrome_click` | Simple buttons |
| `stealth-chrome_evaluate` | Workhorse — JS for everything tricky |
| `stealth-chrome_screenshot` | Verify state visually |

## When to Use This

Any site that needs you to be logged in — Search Console, Cloudflare Dashboard, Gmail, you name it. Stealth-chrome handles it because it *is* your browser. Just keep Chrome running.

## TL;DR

Don't fight browser automation detection. **Use the browser you're already logged into.**

Set it up once, leave the MCP server running, and never think about headless Chrome again. Just don't close your browser.
