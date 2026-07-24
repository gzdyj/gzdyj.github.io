---
title: 使用 acme.sh 申请泛域名 SSL 证书
published: 2026-07-23
description: 通过 acme.sh + Cloudflare DNS API 免费申请 Let's Encrypt 泛域名证书，并自动续期。
tags: [SSL, acme.sh, HTTPS, Cloudflare, 证书]
category: Linux运维与部署
lang: "zh"
---

# 使用 acme.sh 申请泛域名 SSL 证书

Let's Encrypt 提供免费的泛域名证书（Wildcard Certificate），配合 acme.sh 脚本可以全自动申请和续期，非常适合个人站点。

## 安装 acme.sh

```bash
curl https://get.acme.sh | sh -s email=my@example.com
```

## 申请证书（Cloudflare DNS API）

### 1. 获取 Cloudflare API Key

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)，进入 API Tokens 页面获取你的 Global API Key。

### 2. 配置 API Key

```bash
export CF_Key="your-cloudflare-api-key"
export CF_Email="your-cloudflare-email"
```

### 3. 申请泛域名证书

```bash
# 替换为自己的域名
./acme.sh --issue --dns dns_cf -d example.com -d *.example.com
```

### 4. 验证

证书会默认安装到 `~/.acme.sh/` 目录下。查看自动续期任务：

```bash
crontab -l
```

acme.sh 会自动添加定时任务，证书到期前自动续期。

## 与 Nginx Proxy Manager 配合

将生成的证书文件拷贝到 NPM 的对应目录，或在 NPM 中手动上传证书。

## 注意事项

- 阿里云 DNS、腾讯云 DNS 等也有对应的 DNS API 脚本，可在 [acme.sh 官方仓库](https://github.com/acmesh-official/acme.sh) 找到
- 泛域名证书仅支持 DNS 验证方式，不支持 HTTP 验证
- 证书有效期 90 天，acme.sh 会自动续期，无需额外操作

## 参考

- [acme.sh 官方文档](https://github.com/Neilpang/acme.sh)
- [Cloudflare DNS API 脚本](https://github.com/acmesh-official/acme.sh/blob/master/dnsapi/dns_cf.sh)
