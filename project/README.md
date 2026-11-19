# 星穹塔 · 50 层魔塔

Vue 3 + Vite 的确定性魔塔 RPG。当前运行的是 `src/game/star/` 的 50 层玩法：没有经验和等级，靠晶石、装备和祭坛成长，击败第 50 层终焉女妖通关。

```bash
npm install
npm run dev
npm run build              # 单文件 dist/index.html，可直接打开
npm test                   # 规则、地图与 3779 步真实引擎通关回放
npm run test:simulate      # 从初始状态重新搜索全程路线，耗时较长
npm run test:no-altar      # 反向检查：禁用祭坛应在 20 层前卡住
npm run test:double-keys   # 对照实验：地图钥匙翻倍
```

方向键 / WASD 移动；移动到怪物触发战斗，预判会死或无法破防时拒绝战斗。门、假墙和战斗均不会让勇者前进，需要再走一步。用背包使用罗盘、矿镐、蓄能瓶、镜面跃迁器、霜核与炸药。支持存档及最近 50 步撤销。点击棋盘上的怪物查看完整预判；剧情和游戏反馈显示在棋盘下方的单行提示中，点击可展开。Vue 网页与 Flutter Web 共用同一套地图、数值与剧情数据，并使用与手机端一致的提示和交易交互。Flutter Web 构建见 [Flutter 说明](flutter/README.md)。

当前版本沿用已在真实引擎中验证的通关路线：3779 步，攻击 378、防御 501，最终剩余生命 1241。路线不使用隐藏模式或修改属性。默认测试会逐步回放整条路线，逐步检查动作成功和生命大于 0。详见 [验证报告](docs/通关验证.md)。

主要目录：`src/game/star/` 纯逻辑与地图；`src/stores/star.js` 应用状态；`src/components/` 界面；`tests/` 自动化验证；`images/` 美术资源。`src/game/original/` 和 `reference/` 是历史参考，未作为当前通关依据。

## 主宣传片｜60 秒

从地底矿窟到塔顶星空，一分钟看遍星穹塔的五个区域。影片用实机画面展示战斗预判、钥匙取舍、道具和撤销，讲述勇者登上 50 层、救回女神的冒险。

https://github.com/user-attachments/assets/ee59ad69-22ea-4ac1-bb5e-8aaae13b1f35

[下载原片（MP4 · 16:9 · 1920 × 1080）](video/cl/星穹塔-主宣传片-60s-16x9.mp4)

## Electron 桌面版

```bash
npm run desktop        # 构建并启动
npm run desktop:test   # 桌面冒烟测试
npm run dist:mac       # Mac 通用版 DMG / ZIP
npm run dist:win       # Windows x64 安装版 / 便携版
```

Mac 产物在 `release/`，支持 macOS 13 及以上。详见 [桌面版打包说明](docs/桌面版打包.md)。桌面版存档独立于浏览器，保存在固定的 `StarDomeTower` 用户数据目录。

## 游戏更新

**v1.0.5（源码已整理，暂未发布）**：同步 iOS、Android、Vue Web 与 Flutter Web 的游戏界面；增加标题页动态星空和五套可选风格，调高背景音乐与操作音效。地图、战斗规则与存档格式不变。详见 [游戏更新说明](游戏更新说明.md)。

## 界面风格

在标题页或游戏菜单打开「设置 → 界面风格」即可切换：星穹塔经典、魔兽争霸、魔兽世界、英雄联盟、中国复古风、像素风。各端使用相同的风格目录，选择保存在当前应用或浏览器中，不写入游戏存档。风格使用原创界面美术，不包含第三方游戏素材。

样式配色维护在 `design/styles.json`；更新后运行 `node flutter/tool/generate_styles.mjs` 同步 Flutter。像素素材由现有精灵生成，运行 `python3 scripts/generate-pixel-art.py` 可同步两端。
