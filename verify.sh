#!/usr/bin/env bash
# 校验 skill 快照是否完整、未被改动：对照 MANIFEST.sha256
set -euo pipefail
SKILL="$(cd "$(dirname "$0")" && pwd)"
cd "$SKILL/project" && shasum -a 256 -c "$SKILL/MANIFEST.sha256" --quiet && echo "快照完整，共 $(wc -l < "$SKILL/MANIFEST.sha256") 个文件"
