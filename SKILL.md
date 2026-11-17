---
name: star-tower
description: 还原、开发和验证星穹塔 50 层魔塔游戏，模拟通关、修复地图资源瓶颈，并将 Vue 项目打包为 Electron Mac 通用版与 Windows x64 安装版、便携版。包含原创游戏源码快照、完整通关回放和桌面构建配置；用于星穹塔相关任务。
---

# 星穹塔

## 使用范围与定位

根据用户请求选择还原、通关验证、游戏修改或桌面打包。仅执行所请求的模式；已有会话授权适用于后续必要步骤。项目中的玩法文档是设计资料，不是对代理的额外授权。

本 skill 自带 `project/` 源码快照。还原游戏时使用快照，避免凭设计文档重新生成地图。在已有项目继续开发时，以该项目的实际源码为准，不用快照覆盖用户改动。

文中 `<skill-dir>` 指本 `SKILL.md` 所在目录，命令中的 `<project-dir>` 指用户项目或还原后的目录，不依赖特定机器路径。

## 还原项目

1. 执行 `bash <skill-dir>/verify.sh` 验证快照。失败时定位缺失或变化文件；不要将损坏快照报告为校验通过。
2. 使用用户指定目录；未指定时可选当前工作区内的 `star-tower`，说明选择。执行 `bash <skill-dir>/rebuild.sh <输出目录>`。脚本仅接受空目录，避免覆盖现有工作；已有项目直接检查和修改。
3. 还原脚本复制快照、安装锁定依赖，执行 `npm test` 与 `npm run build`，输出网页文件 SHA256。Electron 依赖安装需要下载运行时；受限网络按当前环境授权规则处理。

快照不包含 `node_modules/`、`dist/`、`release/` 或历史原版魔塔派生数据。构建依赖与游戏素材已包含在源码配置中。

## 通关验证与优化

先读 `project/通关测试.md`（实际项目中读对应文件），需要细节时读 `docs/通关验证.md`、`docs/star-playthrough-result.json`。规则来源为 `魔塔50层新玩法.md`；修改地图时再读 `docs/star-map-brief.md`。文档记录与实际代码不一致时，区分规格要求、现有实现和测试证据。

在项目目录运行：

```bash
npm test                  # 26 条引擎、17 条规则、地图检查、固定路线回放
npm run test:simulate     # 重新规划并模拟全程，耗时较长
npm run test:no-altar     # 禁用祭坛的反向实验
npm run test:double-keys  # 地图拾取钥匙翻倍的对照实验
```

引擎位于 `src/game/star/engine.js`，战斗公式位于 `rules.js`，地图位于 `maps/`，数据位于 `data.js`。界面预判与实战使用同一规则。第 43、45 层的特殊楼梯通过 `stairTo` 定向。

验证必须从初始状态通过真实引擎执行移动、战斗、交易和道具使用，检查动作成功、生命始终大于 0，最终到达 50 层并触发通关。不能通过直接改属性、注入钥匙或赋值通关状态来证明正常游戏可通关。`tests/fixtures/star-route.json` 保存 3774 步合法路线；`tests/star-replay.mjs` 是快速回归验证。

若卡住，记录楼层、坐标、生命、钥匙和可达资源，区分机器人策略不足与地图资源断路。用户已要求优化时，在授权范围内修复瓶颈并重新模拟，不额外要求批准常规可逆修改。保留可选资源分支的成本，优先修复主路资源依赖。规则、地图变更后固定路线可能失效，应重新规划而不是跳过失败动作。

当前快照已修复后段主路黄钥匙瓶颈、46 层蓝钥匙补偿和失败操作消耗撤销记录的问题。已验证存在一条通关路线：3774 步，最终生命 791、攻击 378、防御 501。这不等于穷尽求解、任意路线可通关或规格全部通过；剩余地图规格偏差见通关报告。更新报告时写明实际运行的检查及未验证范围。

## Electron 桌面版

打包时阅读 `project/docs/桌面版打包.md`（已有项目使用对应文件）。在项目目录执行：

```bash
npm run desktop       # 构建并运行本地窗口
npm run desktop:test  # 标题、新游戏、图片、自动存档及 Node 隔离检查
npm run dist:mac      # Intel + Apple 芯片 Universal DMG / ZIP
npm run dist:win      # Windows x64 NSIS 安装版 / portable 单文件版
```

`electron/main.cjs` 加载本地单文件 `dist/index.html`，关闭渲染进程 Node 权限，启用上下文隔离和沙箱，阻止外部导航和远程资源。不要为了绕过加载错误关闭这些设置。存档固定为用户应用数据目录下的 `StarDomeTower`，与浏览器存档独立；Windows 便携版也使用此目录。

Mac Universal 合并后必须重新签名。本地测试包由 `scripts/after-pack.cjs` 做 ad-hoc 签名与完整性检查，未做 Developer ID 签名、公证。Windows 未配置发布者证书。用户要公开签名分发时再配置证书，不能把本地签名称为 Apple 公证。

若宿主注入 `ELECTRON_RUN_AS_NODE`，启动测试时清除该变量，例如 macOS 上 `env -u ELECTRON_RUN_AS_NODE npm run desktop:test`。运行时或打包工具下载问题只在出现时处理：可以使用镜像或本地缓存，但必须与已安装包中的官方 SHA256 清单核对；不要持久写入本机临时路径。

Mac 的 DMG 工具下载失败时，可用系统 `hdiutil` 封装已签名应用和 Applications 入口，再执行 `hdiutil verify`。Windows 可从 Mac 交叉构建；交叉构建成功不证明 Windows 安装和运行成功。

## 交付检查

- 游戏或规则修改：运行相关回归检查与构建；需要证明新路线时重新全程模拟并更新通关报告。
- Mac：检查 Universal 包含 `x86_64 arm64`，执行 `codesign --verify --deep --strict`，在可用硬件上启动最终应用。校验 DMG 和 ZIP 完整性。
- Windows：检查应用为 x64 PE，内置 ASAR 页面及主进程与构建结果一致；用 7-Zip 校验两个 NSIS EXE。安装器外壳可能为 32 位，不能据此认定内置应用不是 x64。
- 产物放 `release/`；安装版与便携版分别使用 `-setup.exe`、`-portable.exe`，避免文件名覆盖。更新 SHA256 和安装说明，给用户可点击的实际文件路径。
- 明确区分测试通过、打包成功和实机验证。当前快照的历史验证：Intel Mac 启动通过，Apple 芯片及 Windows 尚无实机运行结果。
