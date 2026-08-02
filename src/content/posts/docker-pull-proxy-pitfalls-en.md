---
title: "Docker Pull Stuck on Windows: A Proxy Configuration Horror Story"
published: 2026-08-02
description: "TUN mode won't save your Docker daemon, the real config lives in settings-store.json, and dead mirror registries will eat your afternoon. A first-hand account."
tags: [Docker, Windows, Proxy]
category: DevOps
lang: "en"
---

# Docker Pull Stuck on Windows: A Proxy Configuration Horror Story

Pulling a single image (`snowdreamtech/frpc`) ate my whole afternoon today. `docker pull` would either sit at `Waiting` and never move, or die with a `dial tcp ... timeout`. My first instinct was "bad network, retry," but after the third attempt with no progress I started to suspect something more interesting was going on.

## Trap 1: TUN mode doesn't touch Docker Desktop

I run sing-box on Windows with TUN mode on, and browsing was perfectly fine, so I assumed my proxy covered everything. Nope. TUN mode intercepts traffic on the host's network stack, but the Docker daemon runs inside the WSL2 VM — and the VM's outbound traffic never goes through the host's TUN interface. A working browser proves nothing about Docker. The daemon needs its own proxy configuration.

## Trap 2: The real config file is settings-store.json

The old tutorials all tell you to edit `settings.json`, but modern Docker Desktop reads `%APPDATA%\Docker\settings-store.json`. I had to add three keys:

```json
"ProxyHTTPMode": "manual",
"OverrideProxyHTTP": "http://127.0.0.1:49456",
"OverrideProxyHTTPS": "http://127.0.0.1:49456"
```

One thing that caught me: restarting containers isn't enough. You need `docker desktop restart` for the new settings to actually apply. Also, Docker Desktop has two proxy layers — an app proxy and a containers proxy — and `docker pull` goes through the containers one. Configure the wrong layer and nothing happens.

## Trap 3: Which port is an actual proxy?

Before configuring anything you need to know which local port is a real proxy. sing-box and v2rayN listen on a bunch of ports, and not all of them are meant for proxying. I first tried port 10814, and still got 405s everywhere.

The test is dead simple: open a raw TCP connection and send a `CONNECT` request:

```bash
printf 'CONNECT www.google.com:443 HTTP/1.1\r\nHost: www.google.com:443\r\n\r\n' | nc 127.0.0.1 49456
```

A real proxy answers `200 Connection established` — in my case that was xray's port 49456. Port 10814 turned out to be a local HTTP service that replies to CONNECT with `405 Method Not Allowed` and an `Allow: GET` header. It was never a proxy. Don't assume a listening port is a proxy port.

## Trap 4: Dead mirror registries are still in daemon.json

With the proxy working it was still slow, which made me look at `~/.docker/daemon.json` and its `registry-mirrors` entry. Two of my three mirrors (USTC and 163) had quietly died — connections time out — and `docker pull` was hanging on those timeouts. One of the survivors (daocloud) even answers requests carrying a `?ns=docker.io` parameter with `405 Method Not Allowed`. In the end I deleted `registry-mirrors` entirely and went straight to Docker Hub through the proxy. Fastest and most reliable.

## Bonus trap: host.docker.internal resolved to IPv6

Finally got the image, only to see frpc containers fail to reach the backend, with frps logging 503s. The culprit: inside the container `host.docker.internal` resolved to an IPv6 address in the `fdc4:...` range, and IPv6 routing in the container network simply doesn't work — the packets went nowhere. Switching to the host's actual IPv4 address, or the Docker Desktop VM gateway (`192.168.65.254`), fixed it instantly.

If I had to boil this afternoon down to two lessons: TUN mode can't see inside the WSL2 VM, so configure a proxy for Docker itself; and when you're unsure whether a port is a proxy, send it a CONNECT and read the response.
