新增 Flutter 原生游戏版本：仅保留游戏画面，不含网页介绍、二维码或模拟手机外壳。保留 50 层地图、战斗预判、祭坛商人、道具、撤销、自动和手动存档，内置离线素材和音乐。

本版本源码包含于可复用 `$star-tower` Skill 的 `project/flutter/`。Vue 与 Electron 源码仍保留。

下载：
- Mac：`mac-universal.dmg` 安装包，或 `mac-universal.zip`；包含 Intel 与 Apple 芯片架构。
- Windows：`windows-x64-setup.exe` 安装包，或 `windows-x64-portable.zip`。
- 安装步骤见 `INSTALL.md`，下载校验见 `SHA256SUMS.txt`。

验证：两平台流水线均运行静态分析、8 项测试（含 3774 步通关回放）和 Release 构建；Mac 检查双架构、签名完整性及压缩包；Windows 自动执行安装、启动存活检查及卸载。该启动检查不代替 Windows 人工完整游玩。此前 Intel Mac 和 iPhone 模拟器已启动验证；Apple 芯片、Android 和 iPhone 真机未实测。本次不发布移动端安装包。

当前 Mac 未进行 Developer ID 签名或公证，Windows 未签发布者证书。Flutter 存档与 Electron／网页版不自动互通。
