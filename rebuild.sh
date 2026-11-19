#!/usr/bin/env bash
# 还原到空目录，安装锁定依赖，执行通关回放与网页构建。
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:?用法：rebuild.sh <空的目标目录>}"
if [ -e "$TARGET_DIR" ]; then
  if [ ! -d "$TARGET_DIR" ] || [ -n "$(ls -A "$TARGET_DIR")" ]; then
    echo "目标必须为空目录，已有项目请直接修改，避免覆盖文件。" >&2
    exit 1
  fi
fi
bash "$SKILL_DIR/verify.sh"
mkdir -p "$TARGET_DIR"
# 只还原已校验的文件，不复制预览构建、缓存或本地配置。
while IFS= read -r entry; do
  relative="${entry#*  }"
  mkdir -p "$TARGET_DIR/$(dirname "$relative")"
  cp -p "$SKILL_DIR/project/$relative" "$TARGET_DIR/$relative"
done < "$SKILL_DIR/MANIFEST.sha256"
cd "$TARGET_DIR"
npm ci --no-audit --no-fund
npm test
npm run build
shasum -a 256 dist/index.html
