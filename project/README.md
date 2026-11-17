# 星穹塔 · 50 层魔塔

Vue 3 + Vite 的确定性魔塔 RPG。当前运行的是 `src/game/star/` 的 50 层玩法：没有经验和等级，靠晶石、装备和祭坛成长，击败第 50 层终焉之主通关。

```bash
npm install
npm run dev
npm run build              # 单文件 dist/index.html，可直接打开
npm test                   # 规则、地图与 3774 步真实引擎通关回放
npm run test:simulate      # 从初始状态重新搜索全程路线，耗时较长
npm run test:no-altar      # 反向检查：禁用祭坛应在 20 层前卡住
npm run test:double-keys   # 对照实验：地图钥匙翻倍
```

方向键 / WASD 移动；移动到怪物触发战斗，预判会死或无法破防时拒绝战斗。门、假墙和战斗均不会让勇者前进，需要再走一步。用背包使用罗盘、矿镐、蓄能瓶、镜面跃迁器、霜核与炸药。支持存档及最近 50 步撤销。

2026-11-17 已在真实引擎中从初始属性模拟通关：3774 步，攻击 378、防御 501，最终剩余生命 791。路线不使用隐藏模式或修改属性。默认测试会逐步回放整条路线，逐步检查动作成功和生命大于 0。详见 [验证报告](docs/通关验证.md)。

主要目录：`src/game/star/` 纯逻辑与地图；`src/stores/star.js` 应用状态；`src/components/` 界面；`tests/` 自动化验证；`images/` 美术资源。`src/game/original/` 和 `reference/` 是历史参考，未作为当前通关依据。

## Electron 桌面版

```bash
npm run desktop        # 构建并启动
npm run desktop:test   # 桌面冒烟测试
npm run dist:mac       # Mac 通用版 DMG / ZIP
npm run dist:win       # Windows x64 安装版 / 便携版
```

Mac 产物在 `release/`，支持 macOS 13 及以上。详见 [桌面版打包说明](docs/桌面版打包.md)。桌面版存档独立于浏览器，保存在固定的 `StarDomeTower` 用户数据目录。
