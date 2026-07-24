---
title: 服务器日常初始化指南
published: 2026-07-23
description: 新服务器到手后的安全加固与常用软件安装清单，包含 SSH 安全配置、Docker、NPM 等。
tags: [Linux, 服务器, 安全, SSH, Docker]
category: Linux运维与部署
lang: "zh"
---

# 服务器日常初始化指南

## 1. 系统更新

```bash
apt update
apt upgrade -y
```

## 2. 安全防护

### 修改 SSH 端口

编辑 SSH 配置文件 `/etc/ssh/sshd_config`，将默认的 22 端口修改为其他端口：

```bash
vim /etc/ssh/sshd_config
# 找到 #Port 22，修改为 Port your-port
# 保存后重启服务
systemctl restart ssh
```

### 创建非 root 用户

```bash
# 创建新用户
adduser your-username

# 安装 sudo
apt install sudo

# 将用户添加到 sudo 组
usermod -aG sudo your-username

# 或编辑 /etc/sudoers 添加：
# your-username ALL=(ALL) NOPASSWD: ALL
```

### 禁用 root 远程登录

```bash
# 在 /etc/ssh/sshd_config 中修改
PermitRootLogin no
```

### SSH 密钥登录 + 禁用密码

```bash
# 在本地生成密钥对，将公钥复制到服务器
ssh-copy-id your-username@your-server-ip

# 在 /etc/ssh/sshd_config 中配置：
PasswordAuthentication no
PubkeyAuthentication yes

# 重启服务
sudo systemctl restart ssh
```

## 3. 常用软件安装

### Docker

参考 [腾讯云 Docker 搭建文档](https://cloud.tencent.com/document/product/213/46000)。

### Nginx Proxy Manager

推荐使用 Docker 安装 NPM，配合图形化管理反向代理和 SSL 证书。

### SSL 证书

使用 acme.sh + Cloudflare DNS API 申请泛域名证书，自动续期。

### 内网穿透

使用 frp 实现内网穿透，配置文件已采用新的 TOML 格式。

### Alist

多存储挂载工具，Docker 一键部署，详见 [Alist 官方文档](https://alist-doc.nn.ci/)。

### 防火墙

- 修改 SSH 端口后记得在防火墙放行新端口
- 使用 iptables 应对 SYN 攻击、CC 攻击等
- 仅开放必要的端口（80、443、SSH 端口等）
