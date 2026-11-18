# 星穹塔 · Flutter

将 Vue 手机模拟器内的游戏迁为 Flutter 原生界面与 Dart 引擎。保留 50 层地图、战斗预判、机关剧情、商人祭坛、背包罗盘、50 步撤销、自动存档和三个手动存档；不包含项目介绍页、二维码、浏览器手机外壳。无需联网即可游玩。原有 SVG 素材已随项目复制，音效和各层背景音乐由本地脚本生成。

## 运行

本机验证环境：Flutter 3.24.4 / Dart 3.5.4、Xcode 14.3、iOS 16.4 模拟器。依赖版本记录在 `pubspec.lock`。

```bash
cd flutter
flutter pub get
flutter devices
flutter run -d <设备ID>
```

| 平台 | 运行／构建 | 验证状态 |
| --- | --- | --- |
| iOS | `flutter run -d <iPhone模拟器或真机ID>` | iPhone 14 / iOS 16.4 模拟器启动成功；实体 iPhone 未测 |
| macOS | `flutter run -d macos` / `flutter build macos` | Debug / Release 构建成功；Release 包含 Intel + Apple 芯片，已在 Intel Mac 启动 |
| Windows | `flutter run -d windows` / `flutter build windows` | 已生成工程，需 Windows + Visual Studio C++ 工具链构建；未实机验证 |
| Linux | `flutter run -d linux` / `flutter build linux` | 已生成工程，未实机验证 |
| Android | `flutter run -d <Android设备ID>` / `flutter build apk` | 已生成工程；本机下载 Gradle 8.3 时网络中断，尚未验证 APK 构建与实机运行 |
| Web | `flutter run -d chrome` / `flutter build web` | 已生成工程，未验证构建 |

Android 工程使用 Gradle 8.3、AGP 8.1.0，建议 JDK 17。若 Flutter 优先选用了 Android Studio 内置的新 JDK，可用 `flutter config --jdk-dir=<JDK17目录>` 配置后构建。iOS 真机需要自己的签名与开发者配置，模拟器无需签名。发布 Android / iOS 应用前需配置正式签名；当前 Android release 沿用 Flutter 模板的调试签名。

如果 CocoaPods 报 UTF-8 编码错误，可在当前终端运行：

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
flutter run -d <iPhone设备ID>
```

## 手机图标与启动页

iOS 和 Android 使用星穹塔金色塔楼图标，原生启动页采用深色背景；iOS 显示塔楼与“星穹塔”标题，Android 12 以上使用系统品牌启动画面。Android 同时提供自适应图标和旧版密度图标。

图标源图为 `tool/branding/icon-source.png`，修改后运行 `python3 tool/generate_branding.py`（需 Pillow），重新构建并安装应用。热重载不会更新原生图标或启动页。

## 操作

- 手机：方向盘点击／长按移动，棋盘滑动移动；点击怪物查看完整战斗预判。点击相邻格也可执行移动／交互。
- 电脑：方向键或 WASD 移动，Z 撤销，B 背包，C 罗盘，Esc 菜单；也支持鼠标点击。
- 走进怪物先战斗，走进门先开门，再走一步进入。不能破防或会死亡的战斗会被拦截。
- 游戏动作自动保存，可用“快速存档”选择手动存档槽。存档在本应用本地保存，与 Vue／Electron 的存档不自动同步。

## 目录与维护

- `lib/game/engine.dart`：纯 Dart 游戏规则、地图实例、事件、战斗、道具及存档。
- `lib/main.dart`：Flutter 游戏画面、输入、弹窗、音频与本地持久化。
- `assets/data/game.json`：Vue 版原创新地图及数值的导出快照，不依赖 Vue 运行时。
- `assets/images/`、`assets/audio/`：离线素材。
- `test/`：完整通关回放与多尺寸界面交互测试。
- `tool/screenshots/`：iPhone 模拟器标题页和游戏页截图。

更新 Vue 地图／数值／图片后，可在仓库根目录同步数据；Dart 引擎的规则变更需同步维护并重新验证：

```bash
node flutter/tool/export-vue.mjs
python3 flutter/tool/generate_audio.py
cd flutter
flutter analyze
flutter test
# 单独回放通关
dart run tool/replay.dart
```

验证详情见 [通关测试.md](通关测试.md)。

## 桌面版发布

版本为 1.0.2；Mac 构建后运行 `bash tool/packaging/macos.sh` 生成 Universal DMG 和 ZIP。Windows 需 Windows + Visual Studio 工具链构建，由 Inno Setup 6 使用 `tool/packaging/windows.iss` 生成安装包；完整流程见 Skill 仓库 `.github/workflows/flutter-release.yml`。安装说明见 [INSTALL.md](tool/packaging/INSTALL.md)。

推送匹配 pubspec 的版本标签后，GitHub Actions 对两平台执行分析、测试、构建及安装包检查，全部通过后创建 Release。Windows 启动检查属于自动化验证，尚无人工完整游玩结果。Mac 未经 Developer ID 签名和公证，Windows 未签发布者证书。
