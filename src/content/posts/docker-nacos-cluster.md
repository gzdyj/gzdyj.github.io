---
title: 使用 Docker 完成 Nacos 集群部署
published: 2026-07-23
description: 基于 Docker 部署 Nacos 2.2 三节点集群，搭配 MySQL 持久化与 Nginx 负载均衡的完整实践。
tags: [Docker, Nacos, 集群, 负载均衡, Nginx]
category: Linux运维与部署
lang: "zh"
---

# 使用 Docker 完成 Nacos 集群部署

## 拉取镜像

```bash
docker pull nacos/nacos-server:v2.2.0
```

> 不要拉 `latest` 标签，生产环境务必指定版本号。

## 数据库准备

Nacos 集群需要 MySQL 存储配置数据。建议使用 MySQL 5.7。

创建数据库 `nacos_config`，并执行 Nacos 官方提供的数据库初始化脚本（可在 Nacos 源码的 `distribution/conf/nacos-mysql.sql` 中找到，包含 `config_info`、`config_info_aggr`、`users`、`roles` 等核心表）。

## 创建 Nacos 容器

创建三个 Nacos 实例组成集群。将以下命令中的 IP 地址替换为你的服务器 IP。

### 节点 1（端口 8848）

```bash
docker run -d \
  -e PREFER_HOST_MODE=hostname \
  -e MODE=cluster \
  -e NACOS_APPLICATION_PORT=8848 \
  -e NACOS_SERVERS="your-server-ip:8848 your-server-ip:8858 your-server-ip:8868" \
  -e SPRING_DATASOURCE_PLATFORM=mysql \
  -e MYSQL_SERVICE_HOST=your-server-ip \
  -e MYSQL_SERVICE_PORT=3306 \
  -e MYSQL_SERVICE_USER=root \
  -e MYSQL_SERVICE_PASSWORD=your-password \
  -e MYSQL_SERVICE_DB_NAME=nacos_config \
  -e NACOS_SERVER_IP=your-server-ip \
  -p 8848:8848 -p 9848:9848 -p 9849:9849 \
  --name my-nacos1 \
  nacos/nacos-server:v2.2.0
```

### 节点 2（端口 8858）

```bash
docker run -d \
  -e PREFER_HOST_MODE=hostname \
  -e MODE=cluster \
  -e NACOS_APPLICATION_PORT=8858 \
  -e NACOS_SERVERS="your-server-ip:8848 your-server-ip:8858 your-server-ip:8868" \
  -e SPRING_DATASOURCE_PLATFORM=mysql \
  -e MYSQL_SERVICE_HOST=your-server-ip \
  -e MYSQL_SERVICE_PORT=3306 \
  -e MYSQL_SERVICE_USER=root \
  -e MYSQL_SERVICE_PASSWORD=your-password \
  -e MYSQL_SERVICE_DB_NAME=nacos_config \
  -e NACOS_SERVER_IP=your-server-ip \
  -p 8858:8858 -p 9858:9858 -p 9859:9859 \
  --name my-nacos2 \
  nacos/nacos-server:v2.2.0
```

### 节点 3（端口 8868）

```bash
docker run -d \
  -e PREFER_HOST_MODE=hostname \
  -e MODE=cluster \
  -e NACOS_APPLICATION_PORT=8868 \
  -e NACOS_SERVERS="your-server-ip:8848 your-server-ip:8858 your-server-ip:8868" \
  -e SPRING_DATASOURCE_PLATFORM=mysql \
  -e MYSQL_SERVICE_HOST=your-server-ip \
  -e MYSQL_SERVICE_PORT=3306 \
  -e MYSQL_SERVICE_USER=root \
  -e MYSQL_SERVICE_PASSWORD=your-password \
  -e MYSQL_SERVICE_DB_NAME=nacos_config \
  -e NACOS_SERVER_IP=your-server-ip \
  -p 8868:8868 -p 9868:9868 -p 9869:9869 \
  --name my-nacos3 \
  nacos/nacos-server:v2.2.0
```

### 验证集群

访问任意节点的 `http://ip:port/nacos`，默认用户名密码为 `nacos/nacos`。在"集群管理"页面可以看到三个节点。

## Nginx 负载均衡

### 配置 upstream

在 Nginx Proxy Manager 的安装目录下创建自定义配置：

```nginx
# /path/to/npm/data/nginx/custom/http.conf
upstream nacos {
    server your-server-ip:8848;
    server your-server-ip:8858;
    server your-server-ip:8868;
}
```

### 配置反向代理

在 NPM 管理页面添加代理：

```
Domain: nacos.your-domain.com
Forward Hostname: 127.0.0.1
Forward Port: 80
```

然后在 Advanced 中添加：

```nginx
location / {
    proxy_pass http://nacos;
}
```

配置 SSL 证书后，即可通过 `https://nacos.your-domain.com/nacos` 访问 Nacos 管理页面。

> 注意：如果使用 Nginx Proxy Manager，需要在容器挂载目录的 `nginx/custom/` 下创建 `http.conf`，NPM 会自动引入该文件到全局配置中。

## 参考

- [Docker 安装 Nacos 集群](https://juejin.cn/post/7175387128648433719)
- [Nginx Proxy Manager 负载均衡配置](https://www.youtube.com/watch?v=Ee35VIpbBPU)
