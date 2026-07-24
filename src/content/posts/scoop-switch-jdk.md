---
title: 利用 Scoop 自由切换 Java (JDK) 版本
published: 2026-07-23
description: 在 Windows 上使用 Scoop 包管理器安装多版本 JDK 并一键切换，告别手动配置环境变量的烦恼。
tags: [Scoop, JDK, Java, Windows, 开发工具]
category: 开发工具
lang: "zh"
---

# 利用 Scoop 自由切换 Java (JDK) 版本

日常开发中经常需要在 Java 8、Java 11、Java 17、Java 21 等不同 JDK 版本之间切换。手动卸载重装非常麻烦，还要清理注册表残留。使用 Scoop 包管理可以轻松解决这个问题。

## 安装 Scoop

打开 PowerShell，执行：

```powershell
# 允许本地脚本执行
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 安装 Scoop
iwr -useb get.scoop.sh | iex

# 验证安装
scoop help
```

## 安装多版本 JDK

### 1. 添加 Java 仓库

```powershell
scoop bucket add java
```

### 2. 查看可用的 JDK 版本

```powershell
scoop search jdk
```

### 3. 安装不同版本

```powershell
# 安装 OpenJDK 8
scoop install openjdk8-redhat

# 安装 OpenJDK 21
scoop install openjdk21
```

### 4. 切换 JDK 版本

```powershell
# 切换到 JDK 8
scoop reset openjdk8-redhat

# 切换到 JDK 21
scoop reset openjdk21

# 切换到 GraalVM 21
scoop reset graalvm21-jdk21
```

> 之前手动安装过 JDK 的，建议把系统环境变量 `JAVA_HOME` 删掉，Scoop 会自动管理用户级别的 `JAVA_HOME`。

## 原理

`scoop reset` 会更新用户环境变量中的 `JAVA_HOME` 和 `PATH`，指向对应版本的安装目录。切换后新开的终端窗口立即生效，无需重启。

同理，Python、Ruby、Node.js 等也可以通过 Scoop 进行多版本管理。
