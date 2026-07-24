---
title: "Switch Java (JDK) Versions Freely with Scoop"
published: 2026-07-23
description: "Install multiple JDK versions on Windows using Scoop package manager and switch between them with a single command — no more manual environment variable tweaking."
tags: [Scoop, JDK, Java, Windows, DevTools]
category: Dev Tools
lang: "en"
---

# Switch Java (JDK) Versions Freely with Scoop

In daily development, you often need to switch between different JDK versions like Java 8, Java 11, Java 17, or Java 21. Manual uninstallation and cleanup of registry entries is painful. Scoop makes this effortless.

## Install Scoop

Open PowerShell and run:

```powershell
# Allow local script execution
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install Scoop
iwr -useb get.scoop.sh | iex

# Verify installation
scoop help
```

## Install Multiple JDK Versions

### 1. Add the Java Bucket

```powershell
scoop bucket add java
```

### 2. List Available JDK Versions

```powershell
scoop search jdk
```

### 3. Install Different Versions

```powershell
# Install OpenJDK 8
scoop install openjdk8-redhat

# Install OpenJDK 21
scoop install openjdk21
```

### 4. Switch JDK Versions

```powershell
# Switch to JDK 8
scoop reset openjdk8-redhat

# Switch to JDK 21
scoop reset openjdk21

# Switch to GraalVM 21
scoop reset graalvm21-jdk21
```

> If you previously installed JDK manually, consider removing the system `JAVA_HOME` environment variable — Scoop manages user-level `JAVA_HOME` automatically.

## How It Works

`scoop reset` updates the user's `JAVA_HOME` and `PATH` environment variables to point to the selected JDK directory. Changes take effect immediately in new terminal windows — no restart needed.

Similarly, Python, Ruby, Node.js, and other runtimes can be managed with Scoop for effortless version switching.
