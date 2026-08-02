---
title: "Windows Docker 跑 frpc 内网穿透：完整踩坑记录"
published: 2026-08-02
description: "接上篇拉镜像的坑，这次是 frp 穿透本身：frpc 端定义代理、写死的配置路径、host.docker.internal 解析成 IPv6、Docker 代理劫持 80 端口、云防火墙放行，一个下午踩了五个坑。"
tags: [Docker, frp, 内网穿透, Windows]
category: 运维部署
lang: "zh"
---

# Windows Docker 跑 frpc 内网穿透：完整踩坑记录

上一篇刚把 Docker Desktop 拉镜像的坑写完（docker-pull-proxy-pitfalls），这次接着踩穿透本身的坑。

背景：本地 Windows 跑若依管理系统，vue dev server 监听 80 端口，想通过 frp 穿透到公网随时访问。frps 跑在腾讯云服务器的 Docker 容器里，本地也用 Docker 容器跑 frpc。听起来不复杂，结果从配置到跑通花了我差不多一个下午。

## 坑一：穿透是 frpc 端定义的，不是 frps

一开始我以为新增一条穿透要改 frps 的配置再重启 docker 容器。查了半天才发现根本不是这么回事：frp 架构里 **proxy 全部定义在 frpc（客户端）**，frps 只负责接收流量转发出去，默认允许任意端口（除非你配了 `allowPorts` 白名单）。所以以后新增穿透，只需要改 frpc 配置然后 reload 就行，frps 基本不用动。

这一点跟很多人的直觉正好相反——服务端"看起来"才是管端口的地方，其实控制权全在客户端手里。

## 坑二：frpc 的配置文件路径是写死的

我用的 snowdreamtech/frpc 镜像，它的启动脚本硬编码读 `/etc/frp/frpc.toml`。第一次挂载我随意挂到了别的路径，结果容器起来日志直接报找不到配置文件。挂载必须挂到这个固定位置：

```bash
docker run -d --name frpc --restart unless-stopped -v C:\frp\frpc.toml:/etc/frp/frpc.toml snowdreamtech/frpc:0.70.1-debian
```

## 坑三：host.docker.internal 在 frpc 容器里解析成了 IPv6

frpc.toml 里 localIP 一开始写的 `host.docker.internal`——容器里访问宿主机的惯用域名。结果 frps 那边一直报 503/403，后端连不上。

查下来发现是 IPv6 的锅：容器里 `host.docker.internal` 被解析成了 `fdc4:...` 开头的 IPv6 地址，而容器网络的 IPv6 路由根本不通，流量直接被丢弃。解法很简单，直接写死 IPv4：

```toml
[[proxies]]
name = "win-ruoyi"
type = "tcp"
localIP = "192.168.65.254"
localPort = 80
remotePort = 6100
```

`192.168.65.254` 是 Docker Desktop VM 的网关，容器内经它就能到达宿主机；或者直接写宿主机的实际 LAN IP 也行。

## 坑四：Docker Desktop 的 HTTP 代理劫持了容器访问宿主机的 80 端口

为了拉镜像，我按上一篇给 Docker Desktop 配了手动代理。结果发现容器访问宿主机 80 端口时被 Docker Desktop 的透明 HTTP 代理劫持了——返回的是带 `Proxy-Connection` 头的 503/403 错误，错误文本里甚至还有 Windows 风格的 `connectex` 字样。而访问 9000 这种非标准端口却一切正常。

判断方法：进容器 curl 宿主机 80 端口，看响应头里有没有 `Proxy-Connection`，有就是被代理层截了。解法：镜像拉完之后把 Docker Desktop 的代理配置清空（`%APPDATA%\Docker\settings-store.json` 里删掉 `OverrideProxyHTTP` / `OverrideProxyHTTPS` / `ProxyHTTPMode` 这几个键），容器流量就直连宿主机了。这个坑最隐蔽，我排查了很久才想到是代理在捣乱。

## 坑五：腾讯云安全组/防火墙要单独放行端口

折腾到这一步，本地链路已经全通了：frps 日志能看到 `get a user connection`，服务器本机 curl 也返回 200，但公网访问还是超时。最后发现是腾讯云轻量服务器控制台的防火墙没放行 6100 端口，加一条入站规则就好了。

这里有个教训：穿透链路要分三层排查——系统防火墙（ufw/iptables）→ 云厂商安全组 → frps 本身，哪层漏了都会卡住，而且从外面看每一层都像"网络问题"。

## 结尾：三段式排查法

这次下来最大的收获是总结出一套排查链路：frp 穿透要分三段看——**公网→frps、frps→frpc、frpc→本地服务**。每段的症状不一样：超时基本是网络/防火墙问题，403 是 frp 内部错误页，503 是 frpc 连不上后端。对照症状定位到段，排查快很多。这次五个坑里，三个都出在最后一段（frpc→本地服务），可见本地这一段最容易被忽略，也最容易踩。
