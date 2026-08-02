---
title: "Running frpc in Docker on Windows: Every Pitfall I Hit"
published: 2026-08-02
description: "A sequel to the image-pull story: the frp tunnel itself — where proxies are actually defined, a hardcoded config path, host.docker.internal resolving to IPv6, Docker Desktop's proxy hijacking port 80, and a cloud firewall that nearly ended me."
tags: [Docker, frp, NAT Traversal, Windows]
category: DevOps
lang: "en"
---

# Running frpc in Docker on Windows: Every Pitfall I Hit

In my last post I documented the ordeal of pulling images with Docker Desktop on Windows. This one is a direct sequel: once the images finally came down, I had to actually get frp working — and the tunnel itself turned out to be its own little minefield.

The setup: a local Windows machine running a RuoYi admin system (Vue dev server on port 80) that I wanted to expose to the public internet via frp. The frps server ran in a Docker container on a Tencent Cloud VPS, and frpc ran locally in another Docker container. Sounds straightforward. It cost me most of an afternoon.

## Pitfall 1: Proxies are defined on the frpc side, not the frps side

Like most people (including me at first), I assumed that opening a new tunnel meant editing the frps config and restarting its container. Wrong. In frp's architecture, **all proxies are defined on the frpc client**. frps just receives and forwards traffic, and by default it accepts any port unless you've configured an `allowPorts` whitelist. Adding a new tunnel is now just a config edit plus a reload on the client; the server stays untouched.

It's genuinely counterintuitive — the server looks like the side that should control ports, but the client holds all the power.

## Pitfall 2: The frpc config path is hardcoded

The snowdreamtech/frpc image hardcodes its startup script to read `/etc/frp/frpc.toml`. My first attempt mounted my config somewhere arbitrary, and the container immediately complained it couldn't find the file. You have to mount to that exact path:

```bash
docker run -d --name frpc --restart unless-stopped -v C:\frp\frpc.toml:/etc/frp/frpc.toml snowdreamtech/frpc:0.70.1-debian
```

## Pitfall 3: host.docker.internal resolved to IPv6 inside the container

I initially set `localIP` to `host.docker.internal` — the usual way for a container to reach its host. The frps side kept reporting 503/403, backend unreachable.

The culprit was IPv6: inside the container, `host.docker.internal` resolved to an address in the `fdc4:...` range, and IPv6 routing in the container network simply doesn't work, so the packets were silently dropped. The fix is to just hardcode an IPv4 address:

```toml
[[proxies]]
name = "win-ruoyi"
type = "tcp"
localIP = "192.168.65.254"
localPort = 80
remotePort = 6100
```

`192.168.65.254` is the Docker Desktop VM gateway — containers can reach the host through it. Your host's actual LAN IP works too.

## Pitfall 4: Docker Desktop's HTTP proxy hijacked traffic to the host's port 80

Remember the manual proxy I configured for Docker Desktop in the previous post (to pull images)? It came back to bite me. Containers hitting the host's port 80 were being intercepted by Docker Desktop's transparent HTTP proxy — responses came back with a `Proxy-Connection` header and a 503/403, the error text even containing Windows-flavored `connectex` wording. Port 9000 (non-standard) worked fine.

To detect it: exec into the container, curl the host on port 80, and check the response headers. If you see `Proxy-Connection`, the proxy layer is intercepting. The fix is annoyingly simple — once your images are pulled, clear the Docker Desktop proxy config (remove `OverrideProxyHTTP` / `OverrideProxyHTTPS` / `ProxyHTTPMode` from `%APPDATA%\Docker\settings-store.json`) and container traffic goes straight to the host again. This one was the sneakiest and took the longest to pin down.

## Pitfall 5: The cloud firewall needs its own port opened

At this point the whole chain was working locally: frps logs showed `get a user connection`, and curling from the VPS itself returned 200. But from the public internet it was still a timeout. The last culprit was the Tencent Cloud lightweight-server console firewall — port 6100 simply wasn't allowed in. One inbound rule later, done.

Lesson: the tunnel crosses three firewall layers — OS firewall (ufw/iptables), cloud security group, and frps itself. Any one of them can silently kill your connection, and all three look like "network problems" from the outside.

## Wrap-up: debug the tunnel in three segments

The biggest takeaway was a debugging method: split the frp tunnel into three segments — **public internet → frps, frps → frpc, frpc → local service**. Each segment has its own symptoms: timeouts point to network/firewall issues, 403 is frp's internal error page, 503 means frpc can't reach the backend. Map the symptom to a segment and you'll find the problem much faster. Three of my five pitfalls lived in the last segment (frpc → local service) — the easiest one to overlook.
