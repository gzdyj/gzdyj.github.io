---
title: Docker 镜像与容器导入导出命令详解
published: 2026-07-23
description: 梳理 docker commit/export/import/save/load 的区别与适用场景，帮你选对正确的命令。
tags: [Docker]
category: Linux运维与部署
lang: "zh"
---

# Docker 镜像与容器导入导出命令详解

Docker 提供了多组镜像和容器的导入导出命令，初学者容易混淆。本文梳理它们之间的核心区别。

## docker export / docker import

作用于 **容器**，导出的是容器当前文件系统的快照。

```bash
# 导出容器快照
docker export container-id > snapshot.tar

# 导入为镜像
docker import snapshot.tar new-image-name:tag
```

**特点：**
- 只保留从镜像启动到 export 时对文件系统的修改，**丢弃历史层和元数据**
- 导出的包体积较小（只有一层文件系统）
- 导入时必须指定新镜像名称和 tag
- 导入后的镜像启动必须加 `/bin/bash` 或其他 entrypoint

**适用场景：** 制作基础镜像。例如从 ubuntu 镜像启动容器，安装软件后导出为基础镜像分发给其他人。

## docker commit

作用于 **容器**，将容器的修改保存为新的镜像。

```bash
docker commit container-id new-image-name:tag
```

**常用选项：**
- `-a`：作者信息
- `-m`：提交说明
- `-p`：提交时暂停容器运行

**特点：**
- 保存了容器的读写层 + 镜像原有的历史层
- 原本 N 层的镜像，commit 后会变成 N+1 层
- 可以保留启动命令等元数据

**适用场景：** 快速保存调试环境的修改，生成可复用的镜像。

## docker save / docker load

作用于 **镜像**，导出的是完整的镜像分层结构。

```bash
# 导出镜像
docker save -o image.tar image-name:tag

# 导入镜像
docker load -i image.tar
```

**特点：**
- 保留完整的分层结构和元数据
- 包体积比 export 大（包含所有历史层）
- `load` 无法重命名镜像，`import` 可以指定新名称

**适用场景：** 离线环境迁移镜像。在没有外网的生产服务器上，先在有网的机器上 pull 镜像，save 打包后拷贝到生产环境再 load。

## 核心区别总结

| 命令 | 作用对象 | 保留历史层 | 包体积 | 导入后可重命名 |
|------|---------|-----------|--------|--------------|
| `docker export` | 容器 | ❌ 只有一层 | 小 | ✅ |
| `docker commit` | 容器 | ✅ 增加一层 | 中 | ✅ |
| `docker save` | 镜像 | ✅ 完整保留 | 大 | ❌ |
| `docker load` | 镜像 | ✅ 完整保留 | 大 | ❌ |
| `docker import` | 快照文件 | ❌ 只有一层 | 小 | ✅ |

一句话记忆法：**save/load 是对镜像操作，export/import 是对容器操作，commit 是容器→镜像的桥梁。**
