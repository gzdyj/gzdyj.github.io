---
title: "Windows Docker Desktop 拉镜像卡住：代理配置踩坑记录"
published: 2026-08-02
description: "TUN 模式救不了 Docker、settings-store.json 藏玄机、镜像加速源拖后腿——一次 pull 失败引发的连环排查。"
tags: [Docker, Windows, 代理]
category: 运维部署
lang: "zh"
---

# Windows Docker Desktop 拉镜像卡住：代理配置踩坑记录

今天拉个镜像卡了我一下午。`docker pull snowdreamtech/frpc`，回车之后半天没动静，要么一直停在 `Waiting`，要么直接 `dial tcp ... timeout`。一开始我以为是网络差，重试几次还是老样子，才意识到这事没这么简单。

## 坑一：TUN 模式对 Docker Desktop 无效

我 Windows 上跑着 sing-box，TUN 模式开着，浏览器上网一切正常，所以第一反应是"我明明有代理啊"。但问题恰恰出在这：TUN 模式接管的是宿主机网卡上的流量，而 Docker Desktop 的 daemon 跑在 WSL2 虚拟机里，虚拟机出站的流量根本不走宿主机的 TUN 接口。浏览器能翻墙，不代表 Docker 能翻墙，它的代理得单独配。

## 坑二：代理配置藏在 settings-store.json 里

网上那些老教程还在教改 `settings.json`，实际上 Docker Desktop 现在的配置在 `%APPDATA%\Docker\settings-store.json`。往里加三样东西：

```json
"ProxyHTTPMode": "manual",
"OverrideProxyHTTP": "http://127.0.0.1:49456",
"OverrideProxyHTTPS": "http://127.0.0.1:49456"
```

改完还得 `docker desktop restart` 才会生效，光重启容器没用，我在这上面浪费了不少时间。另外 Docker Desktop 有两套代理：app 代理和 containers 代理，`docker pull` 走的是容器的代理，别配错地方。

## 坑三：到底哪个端口才是真代理？

配代理之前先得搞清楚本地哪个端口能用。sing-box 和 v2rayN 会监听一堆端口，但真不一定都能当代理使。我一开始以为 10814 就是代理端口，配上去还是各种 405。

判断方法其实很简单：开一个原始 TCP 连接，发一条 `CONNECT` 请求试试：

```bash
printf 'CONNECT www.google.com:443 HTTP/1.1\r\nHost: www.google.com:443\r\n\r\n' | nc 127.0.0.1 49456
```

返回 `200 Connection established` 的就是正经代理——我这边是 xray 的 49456 端口；而 10814 那个端口实际是个本地 HTTP 服务，对 CONNECT 直接回 `405 Method Not Allowed` 外加一句 `Allow: GET`，它根本不是代理。所以别看到端口在监听就想当然。

## 坑四：镜像加速源里混着失效源

代理配好之后还是慢，这才想起 `~/.docker/daemon.json` 里还配着一堆镜像加速源。检查下来 USTC 和 163 的加速源早就失效了，连过去直接超时，`docker pull` 就卡在等失效源超时上。还有个更刁钻的：daocloud 对带 `?ns=docker.io` 参数的请求会回 `405 Method Not Allowed`。最后干脆把 `registry-mirrors` 清空，直连 Docker Hub 走代理，反而最稳。

## 附带一坑：host.docker.internal 解析成 IPv6

镜像终于拉下来了，结果 frpc 容器跑起来后端还是连不上，frps 那边一直报 503。查了半天发现是容器里 `host.docker.internal` 解析成了 `fdc4:...` 的 IPv6 地址，而容器网络的 IPv6 路由根本不通，流量全被扔了。换成宿主机实际的 IPv4 地址，或者用 Docker Desktop VM 的网关（比如 `192.168.65.254`），立马就好。

一趟折腾下来，最值钱的教训就两条：TUN 模式管不到 WSL2 里的 Docker，代理必须给 Docker 单独配；以及拿不准端口能不能用，发一条 CONNECT 探一探就知道了。
