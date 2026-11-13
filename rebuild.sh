#!/usr/bin/env bash
# 把 star-tower skill 里的项目快照还原到目标目录，安装依赖，跑测试，构建，并输出产物校验和。
# 用法：bash ~/.claude/skills/star-tower/rebuild.sh /path/to/target
set -euo pipefail
SKILL="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:?用法：rebuild.sh <目标目录>}"
mkdir -p "$TARGET"
cp -R "$SKILL/project/." "$TARGET/"
cd "$TARGET"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
node tests/star-rules.mjs | tail -1
node tests/star-engine.mjs | tail -1
node tools/star-verify.mjs
npm run build
shasum -a 256 dist/index.html
