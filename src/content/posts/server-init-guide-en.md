---
title: "Server Initialization Guide"
published: 2026-07-23
description: "A checklist for securing and setting up a new Linux server, including SSH hardening, Docker, NPM, and more."
tags: [Linux, Server, Security, SSH, Docker]
category: DevOps
lang: "en"
---

# Server Initialization Guide

## 1. System Update

```bash
apt update
apt upgrade -y
```

## 2. Security Hardening

### Change the SSH Port

Edit the SSH config file `/etc/ssh/sshd_config` and change the default port 22:

```bash
vim /etc/ssh/sshd_config
# Find #Port 22, change to Port your-port
# Save and restart the service
systemctl restart ssh
```

### Create a Non-root User

```bash
# Create a new user
adduser your-username

# Install sudo
apt install sudo

# Add the user to the sudo group
usermod -aG sudo your-username

# Or edit /etc/sudoers to add:
# your-username ALL=(ALL) NOPASSWD: ALL
```

### Disable Root Remote Login

```bash
# In /etc/ssh/sshd_config, set:
PermitRootLogin no
```

### SSH Key Authentication + Disable Passwords

```bash
# Generate a key pair locally, then copy the public key to the server
ssh-copy-id your-username@your-server-ip

# In /etc/ssh/sshd_config:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart the service
sudo systemctl restart ssh
```

## 3. Install Common Software

### Docker

Refer to the [official Docker documentation](https://docs.docker.com/engine/install/ubuntu/) for installation.

### Nginx Proxy Manager

Install NPM via Docker for a web UI to manage reverse proxies and SSL certificates.

### SSL Certificates

Use acme.sh + Cloudflare DNS API to issue wildcard certificates with auto-renewal.

### Internal Network Tunneling (frp)

Use frp for internal network tunneling. Newer versions use TOML configuration.

### Alist

Multi-storage mounting tool with one-click Docker deployment. See [Alist documentation](https://alist-doc.nn.ci/) for details.

### Firewall

- Remember to allow the new SSH port in the firewall
- Use iptables to mitigate SYN and CC attacks
- Only expose necessary ports (80, 443, SSH, etc.)
