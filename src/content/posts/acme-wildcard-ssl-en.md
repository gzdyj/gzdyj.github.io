---
title: "Request Wildcard SSL Certificates with acme.sh"
published: 2026-07-23
description: "Get free Let's Encrypt wildcard certificates via acme.sh + Cloudflare DNS API with automatic renewal."
tags: [SSL, acme.sh, HTTPS, Cloudflare, Certificate]
category: DevOps
lang: "en"
---

# Request Wildcard SSL Certificates with acme.sh

Let's Encrypt provides free wildcard certificates. Combined with the acme.sh script, you can fully automate issuance and renewal — perfect for personal sites.

## Install acme.sh

```bash
curl https://get.acme.sh | sh -s email=my@example.com
```

## Issue a Certificate (Cloudflare DNS API)

### 1. Get Your Cloudflare API Key

Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens), go to API Tokens, and get your Global API Key.

### 2. Configure the API Key

```bash
export CF_Key="your-cloudflare-api-key"
export CF_Email="your-cloudflare-email"
```

### 3. Issue the Wildcard Certificate

```bash
# Replace with your domain
./acme.sh --issue --dns dns_cf -d example.com -d *.example.com
```

### 4. Verification

The certificate will be installed to `~/.acme.sh/`. Check the auto-renewal cron job:

```bash
crontab -l
```

acme.sh automatically adds a scheduled task for renewal before expiration.

## Working with Nginx Proxy Manager

Copy the generated certificate files to NPM's directory, or upload them manually through NPM's web interface.

## Notes

- Alibaba Cloud DNS, Tencent Cloud DNS, etc., also have their own DNS API scripts available in the [acme.sh official repository](https://github.com/acmesh-official/acme.sh)
- Wildcard certificates only support DNS verification, not HTTP
- Certificates are valid for 90 days; acme.sh handles renewal automatically

## References

- [acme.sh official documentation](https://github.com/Neilpang/acme.sh)
- [Cloudflare DNS API script](https://github.com/acmesh-official/acme.sh/blob/master/dnsapi/dns_cf.sh)
