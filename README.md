# 星穹塔 Star Dome Tower

> 💰 成本：100 元 ｜ ⏱️ 时间：3 小时以上（一路写到凌晨 3 点）

> 一座从地底矿窟修到星空的 50 层观星塔，一段原创冒险。

> 🤖 本项目由 AI 驱动开发。

![星穹塔界面与玩法介绍](bg/bfde9003e6f131855c59b340e078aa1f.png)

《星穹塔》是一款魔塔风格游戏，提供 Vue 3 + Vite 网页版、Electron 桌面版和 Flutter 原生版。终焉女妖将你心爱的女神囚禁在塔顶，你要登上五十层，打破星幕，带她回家。

## 主宣传片｜60 秒

从地底矿窟到塔顶星空，一分钟看遍星穹塔的五个区域。影片用实机画面展示战斗预判、钥匙取舍、道具和撤销，讲述勇者登上 50 层、救回女神的冒险。

https://github.com/user-attachments/assets/ee59ad69-22ea-4ac1-bb5e-8aaae13b1f35

[下载原片（MP4 · 16:9 · 1920 × 1080）](project/video/cl/星穹塔-主宣传片-60s-16x9.mp4)

## 💻 电脑客户端下载（Flutter v1.0.2）

下方链接为历史安装包。当前 Skill 源码快照为 **v1.0.5，暂未发布**。

| 平台 | 安装版 | 解压即玩 |
| --- | --- | --- |
| Mac（Intel / Apple 芯片） | [下载 DMG 安装包](https://github.com/lnys/starTower/releases/download/v1.0.2/StarDomeTower-Flutter-1.0.2-mac-universal.dmg) | [下载 ZIP](https://github.com/lnys/starTower/releases/download/v1.0.2/StarDomeTower-Flutter-1.0.2-mac-universal.zip) |
| Windows（x64） | [下载 EXE 安装包](https://github.com/lnys/starTower/releases/download/v1.0.2/StarDomeTower-Flutter-1.0.2-windows-x64-setup.exe) | [下载便携 ZIP](https://github.com/lnys/starTower/releases/download/v1.0.2/StarDomeTower-Flutter-1.0.2-windows-x64-portable.zip) |

Mac 打开 DMG 后将“星穹塔”拖入 Applications；Windows 运行安装包，或完整解压便携 ZIP 后打开 `star_tower.exe`。客户端可离线游玩。

[安装说明](https://github.com/lnys/starTower/releases/download/v1.0.2/INSTALL.md) · [SHA256 校验清单](https://github.com/lnys/starTower/releases/download/v1.0.2/SHA256SUMS.txt) · [版本发布页](https://github.com/lnys/starTower/releases/tag/v1.0.2)

### Electron 版下载（v0.1.0）

| 平台 | 安装版 | 免安装版 |
| --- | --- | --- |
| Mac（Intel / Apple 芯片） | [下载 DMG 安装包](https://github.com/lnys/starTower/releases/download/v0.1.0/StarDomeTower-0.1.0-mac-universal.dmg) | [下载 ZIP](https://github.com/lnys/starTower/releases/download/v0.1.0/StarDomeTower-0.1.0-mac-universal.zip) |
| Windows（x64） | [下载 EXE 安装包](https://github.com/lnys/starTower/releases/download/v0.1.0/StarDomeTower-0.1.0-windows-x64-setup.exe) | [下载便携 EXE](https://github.com/lnys/starTower/releases/download/v0.1.0/StarDomeTower-0.1.0-windows-x64-portable.exe) |

[Mac 安装说明](https://github.com/lnys/starTower/releases/download/v0.1.0/Mac-Install.md) · [Windows 安装说明](https://github.com/lnys/starTower/releases/download/v0.1.0/Windows-Install.md) · [SHA256 校验清单](https://github.com/lnys/starTower/releases/download/v0.1.0/SHA256SUMS.txt) · [版本发布页](https://github.com/lnys/starTower/releases/tag/v0.1.0)

## 游戏特色

- **没有随机、没有经验。** 每层都是 11×11 的固定地图，战斗结果在开打前就能精确算出。
- **战斗预判。** 与怪物相邻时，卡片会显示预计损失、回合数与需要的生命。会死或打不动的怪，游戏会拒绝你走进去。
- **有限的资源。** 钥匙永远比门少，金币、生命、钥匙都不可再生，要决定哪扇门值得开、哪只怪值得打、现在打还是以后回头打。
- **祭坛与商人。** 用金币换生命、攻击或防御，价格随全塔购买次数递增。商人只卖一次补给。
- **撤销与存档。** 最多撤销 50 步，换层时自动存档，也可以随时手动存档。
- **为手机设计。** 屏幕底部是方向盘式的操作区，PC 端会显示手机外壳预览。

## 五个区域

| 层数 | 区域 |
| --- | --- |
| 1–10 层 | 苔藓地窖 · 地窖看守 |
| 11–20 层 | 潮汐机关城 · 潮汐司钟 |
| 21–30 层 | 镜廊 · 镜廊之主 |
| 31–40 层 | 熔炉深处 · 熔炉督主 |
| 41–50 层 | 星穹 · 终焉女妖 |

第 41 层之后，灼域怪会在你走完一步后灼伤相邻的勇者，星穹盾可以免疫。击败第 50 层的终焉女妖即为通关。

## 操作方式

| 操作 | 键盘 | 手机 |
| --- | --- | --- |
| 移动 | `↑ ↓ ← →` 或 `W A S D` | 屏幕方向盘 |
| 撤销 | `Z` | 方向盘中心 |
| 菜单 | `Esc` | 菜单按钮 |
| 静音 | `M` | — |

## 快速开始

环境要求：Node.js（支持 ESM）与 npm。

```bash
cd project
npm install
npm run dev      # 本地开发，默认打开 Vite 开发服务器
```

构建单文件版本：

```bash
npm run build    # 产物为 dist/index.html，可直接双击用浏览器打开
```

运行测试与全塔校验：

```bash
npm test
```

`npm test` 会依次运行 28 条引擎测试、17 条规则测试、全塔地图校验、3779 步真实引擎通关回放和 3 项界面回归测试。

## Flutter 原生版

源码位于 [project/flutter](project/flutter/README.md)，仅包含游戏画面，无介绍页或手机外壳。包含 Windows、macOS、iOS、Android 平台工程；移动端构建和签名状态见 Flutter README。安装包见 [GitHub Releases](https://github.com/lnys/starTower/releases)。

```bash
cd project/flutter
flutter pub get --enforce-lockfile
flutter test
flutter run -d macos
```

## 项目结构

```
project/
├── src/
│   ├── App.vue              主界面
│   ├── components/          标题页、棋盘、弹窗、故事框、结局动画等
│   ├── engine/              音频、图片、存档等浏览器端工具
│   └── game/star/
│       ├── engine.js        纯 JS 游戏引擎，不依赖 Vue
│       ├── rules.js         唯一的战斗公式实现
│       ├── data.js          怪物、道具、商人数据
│       └── maps/            50 层地图（分片文件）
├── images/                  SVG 素材
├── scripts/generate-images.js  素材生成脚本
├── tests/                   引擎、规则与全程模拟测试
├── tools/                   全塔校验与地图检查脚本
├── docs/star-map-brief.md   地图制作规范
└── 魔塔50层新玩法.md        玩法规格（规则与数值的权威来源）
```

规则与数值以 `魔塔50层新玩法.md` 为准。引擎是纯 JavaScript，界面预判与实战都调用同一份 `rules.js`，所以预判与实际结果一致。

## 修改与扩展

- **新增怪物或道具**：修改 `src/game/star/data.js`，并同步 `src/engine/star-art.js` 中的素材映射。
- **修改地图**：编辑 `src/game/star/maps/*.js`，然后运行 `node tools/star-verify.mjs` 做全塔校验，运行 `node tools/star-check.mjs <文件>` 检查单个分片的尺寸、图例与连通性。
- **修改规则**：修改 `src/game/star/rules.js`，并同步 `tests/star-rules.mjs` 中的核对用例。
- 每次改动后建议运行：`npm test && npm run build`。

## 更新说明

### v1.0.5 — 2026-11-19

- iOS、Android、Vue Web 和 Flutter Web 对齐 Logo、标题、可展开的单行提示及战斗／交易交互，给棋盘留出更多空间。
- 调高背景音乐和操作音效，保留已保存的设置；加入五套新界面风格，可实时切换并保存。
- 「返回游戏主界面」按钮加入房屋图标；「新的冒险」标题页加入随主题变化的动态星空，支持减少动态效果。
- Skill 已同步源码、资源和 60 秒主宣传片；详见 [游戏更新说明](project/游戏更新说明.md)。本次不新增 Release 或安装包。

### v1.0.4 — 2026-11-18

- 引路人可以重复讲述原对白；罗盘等首次奖励仍只发放一次，旧存档也可重读。
- 为矿镐、霜核、罗盘等 9 种特殊道具补齐独立 SVG 图标，Vue 与 Flutter 共用素材。
- 校正 11 层的黄门数量、39／48 层补给，并补回 41 层裂墙。Vue 与 Flutter 均通过 3779 步正常通关回放，最终生命 1241、攻击 378、防御 501。
- 修复微信群二维码图片地址，增大游戏二维码留白；Chrome 窄屏布局、音频启动和静音切换验证通过。验证范围见 [通关测试](project/通关测试.md)。
- 本次为源码更新，电脑客户端安装包仍为上方历史版本。

### v1.0.3 — 2026-11-18

- Flutter Web / PC 窗口采用屏幕宽度 1/4、高度 4/5，禁止手动调整；NPC 对话和交易固定在棋盘下方，不再遮挡底部操作。
- 第 50 层重做为星空花园：中央月光小屋内的女神、四名可战斗守卫、花圃、水晶喷泉、灯笼与长毯。
- 巨型终焉女妖采用巨角、残翼、獠牙和猩红裂隙造型；击败即可救回女神，进入星光、插画、信件与纪念称号组成的惊喜结局。
- 补齐引路人、祭坛与全部怪物图标，修复快速存档文字折行，Vue 与 Flutter 同步。
- 已通关存档可重看结局；旧终层存档升级场景时保留人物属性、首领击败状态与通关状态。
- Vue 28 项引擎、17 项规则、地图校验及构建通过，Flutter 18 项测试及静态检查通过；3774 步通关回放结果保持一致。
- 更新源码快照、玩法文档与测试记录，详见 [游戏更新说明](project/游戏更新说明.md)。本版发布 Skill 与源码，不新增各平台安装包；上方下载仍为历史版本，不包含本次新增功能。

### v1.0.2 — 2026-11-18

- 📱 Skill 新增 `project/flutter/` 原生游戏源码，保留 50 层游戏、离线素材、音乐及本地存档，不包含网页介绍和手机外壳。
- ✅ Dart 引擎 3774 步通关回放结果与 Vue 一致：生命 791、攻击 378、防御 501；8 项引擎和多尺寸界面测试通过。
- 📦 新增 Flutter Mac Universal DMG／ZIP、Windows x64 安装包／便携 ZIP 的 GitHub Actions 构建发布流程；双平台通过后发布，附校验值和安装说明。
- 🛠️ `verify.sh` 校验同时覆盖 Vue 和 Flutter 源码。`rebuild.sh` 继续还原完整项目并验证 Vue；Flutter 另按上文命令运行。
- 🧪 Intel Mac 和 iPhone 模拟器已启动验证；Windows 发布流程包含安装、启动和卸载检查。Apple 芯片与移动端真机尚未实测，双平台正式构建、Mac 包完整性及 Windows 安装／启动／卸载检查均已通过，见 [v1.0.2 下载](https://github.com/lnys/starTower/releases/tag/v1.0.2)。

### v1.0.1 — 2026-11-17

- 📦 新增可复用 Skill，入口为 [SKILL.md](SKILL.md)，名称 `$star-tower`。当前目录即完整 Skill 包，包含 `project/` 原创源码快照、`MANIFEST.sha256` 校验清单、`verify.sh` 和 `rebuild.sh`，不包含编译产物与依赖缓存。
- 🖥️ 还原后可构建网页、Mac Universal 桌面版和 Windows x64 安装版／便携版。
- 🛠️ `rebuild.sh` 只写入空目录，运行锁定依赖安装、通关回放和网页构建。
- ✅ 完整通关报告和桌面说明位于 [通关测试](project/通关测试.md) 与 [桌面版打包](project/docs/桌面版打包.md)。历史验证包含 Intel Mac 启动、Mac 包完整性及 Windows 安装包结构检查；Apple 芯片和 Windows 实机运行尚未验证。

```bash
bash verify.sh
bash rebuild.sh /path/to/empty/star-tower
cd /path/to/empty/star-tower
npm run dist:mac
npm run dist:win
```

### v1.0.0 — 2026-11-13 首次发布

- 🎉 正式发布第一版《星穹塔》，共 50 层、五个区域、五位区域首领。
- 🗺️ 完整的 50 层固定地图，附带全塔地图校验脚本（楼梯链、入口、机关门配对等）。
- ⚔️ 战斗预判：与怪物相邻时显示预计损失、回合数与所需生命。
- 🏪 祭坛与商人系统，撤销（最多 50 步）与自动 / 手动存档。
- 📱 适配手机屏幕的方向盘式操作区，PC 端提供手机外壳预览。

## 持续更新与反馈

本项目会持续更新、不断完善。如果你有好的建议（玩法、数值、地图、界面、美术等），欢迎到 [Issues](https://github.com/lnys/starTower/issues) 提出，我们会认真查看。

欢迎提交 Issue 或 Pull Request，尤其欢迎关于地图平衡、桌面兼容性与美术素材的反馈。

## 致谢

本作的地图、数值与剧情文本为原创设计。

特别感谢经典的**《魔塔》（Magic Tower）**，本作的灵感来源于它的核心循环：一层一层向上、在有限资源中取舍。本作不复制其地图、名称或对白。

## 💬 加入微信交流群

扫码加入微信交流群，分享攻略、反馈问题、聊聊星穹塔。

<img src="https://fm-mochat-test.oss-cn-hangzhou.aliyuncs.com/images/start-qrcode.jpg" alt="微信交流群二维码" width="200" />

## 许可证

本项目基于 [MIT License](LICENSE) 发布。
