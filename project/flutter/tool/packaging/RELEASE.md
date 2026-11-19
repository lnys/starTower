## 星穹塔 v1.0.5 · Flutter

- iOS、Android、Vue Web 与 Flutter Web 对齐 Logo、标题、棋盘提示和战斗／交易交互。
- 游戏语言可在简体中文、英语和日语之间即时切换，默认简体中文。新增五套可选界面风格和动态标题页，调高背景音乐和音效。
- Vue 移除扫码下载推广区，保留触屏操作。游戏规则、地图与存档格式不变。

| 平台 | 下载文件 | 说明 |
| --- | --- | --- |
| Windows x64 | `windows-x64-setup.exe` / `windows-x64-portable.zip` | 安装版／便携版；无发布者签名 |
| macOS | `mac-universal.dmg` / `mac-universal.zip` | Intel 与 Apple 芯片；临时签名，未经公证 |
| Android | `android-test.apk` | 测试签名，可侧载测试；不用于 Google Play |
| iOS | `ios-simulator-universal.zip` | 仅 Xcode 模拟器可用，不是 iPhone 真机 IPA |

下载后可用 `SHA256SUMS.txt` 校验，安装步骤见 `INSTALL.md`。桌面流水线执行静态分析、测试及包检查；Windows 自动检查安装、启动和卸载，不代替人工完整游玩。移动包不代表已通过真机验证。
