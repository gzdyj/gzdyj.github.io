---
title: "Deploy a Nacos Cluster with Docker"
published: 2026-07-23
description: "A complete guide to deploying a 3-node Nacos 2.2 cluster with Docker, using MySQL for persistence and Nginx for load balancing."
tags: [Docker, Nacos, Cluster, LoadBalancer, Nginx]
category: DevOps
lang: "en"
---

# Deploy a Nacos Cluster with Docker

## Pull the Image

```bash
docker pull nacos/nacos-server:v2.2.0
```

> Avoid pulling the `latest` tag — always pin a specific version for production.

## Database Setup

Nacos cluster requires MySQL to store configuration data. MySQL 5.7 is recommended.

Create a database named `nacos_config` and run the official initialization script (located in the Nacos source at `distribution/conf/nacos-mysql.sql`, which creates `config_info`, `config_info_aggr`, `users`, `roles`, and other core tables).

## Create Nacos Containers

Create three Nacos instances to form the cluster. Replace IP addresses in the commands below with your server's IP.

### Node 1 (Port 8848)

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

### Node 2 (Port 8858)

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

### Node 3 (Port 8868)

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

### Verify the Cluster

Visit `http://ip:port/nacos` on any node. The default credentials are `nacos/nacos`. You should see all three nodes listed in the Cluster Management page.

## Nginx Load Balancing

### Configure the Upstream

Create a custom configuration in your Nginx Proxy Manager installation directory:

```nginx
# /path/to/npm/data/nginx/custom/http.conf
upstream nacos {
    server your-server-ip:8848;
    server your-server-ip:8858;
    server your-server-ip:8868;
}
```

### Configure the Reverse Proxy

Add a proxy in NPM's web interface:

```
Domain: nacos.your-domain.com
Forward Hostname: 127.0.0.1
Forward Port: 80
```

Then add this in the Advanced tab:

```nginx
location / {
    proxy_pass http://nacos;
}
```

After configuring an SSL certificate, you can access the Nacos console at `https://nacos.your-domain.com/nacos`.

> Note: When using Nginx Proxy Manager, create `http.conf` under the `nginx/custom/` directory in the container mount. NPM will automatically include this file in the global configuration.

## References

- [Docker Nacos Cluster Guide](https://juejin.cn/post/7175387128648433719)
- [Nginx Proxy Manager Load Balancing](https://www.youtube.com/watch?v=Ee35VIpbBPU)
