---
title: "Docker Image and Container Export/Import Commands Explained"
published: 2026-07-23
description: "Clarifying the differences between docker commit/export/import/save/load and when to use each one."
tags: [Docker]
category: DevOps
lang: "en"
---

# Docker Image and Container Export/Import Commands Explained

Docker provides several commands for exporting and importing images and containers, which can be confusing for beginners. This article breaks down the key differences.

## docker export / docker import

These operate on **containers** and export a snapshot of the container's current filesystem.

```bash
# Export container snapshot
docker export container-id > snapshot.tar

# Import as an image
docker import snapshot.tar new-image-name:tag
```

**Characteristics:**
- Only retains filesystem changes made from container start to export — **discards history layers and metadata**
- Smaller file size (single filesystem layer)
- Must specify a new image name and tag on import
- Imported images require `/bin/bash` or another entrypoint on start

**Use case:** Creating base images. For example, start a container from ubuntu, install software, then export it as a distributable base image.

## docker commit

Operates on **containers**, saving modifications as a new image.

```bash
docker commit container-id new-image-name:tag
```

**Common options:**
- `-a`: Author information
- `-m`: Commit message
- `-p`: Pause the container during commit

**Characteristics:**
- Preserves the container's writable layer plus the original image's history layers
- An N-layer image becomes N+1 layers after commit
- Retains metadata like the entrypoint command

**Use case:** Quickly save changes from a debugging environment to create a reusable image.

## docker save / docker load

Operate on **images**, exporting the complete layer structure.

```bash
# Save an image
docker save -o image.tar image-name:tag

# Load an image
docker load -i image.tar
```

**Characteristics:**
- Preserves the full layer structure and metadata
- Larger file size than export (includes all history layers)
- `load` cannot rename the image, while `import` can assign a new name

**Use case:** Offline image migration. On a server without internet, pull the image on a connected machine, save it, copy the archive, then load it on the target server.

## Comparison Summary

| Command | Target | History Layers | File Size | Rename on Import |
|---------|--------|---------------|-----------|------------------|
| `docker export` | Container | ❌ Single layer only | Small | ✅ |
| `docker commit` | Container | ✅ Adds one layer | Medium | ✅ |
| `docker save` | Image | ✅ Full preservation | Large | ❌ |
| `docker load` | Image | ✅ Full preservation | Large | ❌ |
| `docker import` | Snapshot file | ❌ Single layer only | Small | ✅ |

**Quick memory aid:** save/load work with **images**, export/import work with **containers**, and commit is the bridge from container → image.
