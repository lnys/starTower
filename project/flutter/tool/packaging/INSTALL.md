# 星穹塔 Flutter 安装

- macOS：下载 `mac-universal.dmg`，打开并把“星穹塔”拖入 Applications；也可下载 ZIP 解压后运行。支持 Intel 和 Apple 芯片，最低 macOS 10.14。当前为 ad-hoc 签名，未经 Apple Developer ID 签名或公证；若系统拦截，在系统设置的“隐私与安全性”中允许本次打开。
- Windows：Windows 10/11 x64，下载 `windows-x64-setup.exe` 安装；无需管理员权限。便携版 ZIP 必须完整解压后运行 `star_tower.exe`，不可单独移动 EXE。已包含 Visual C++ 运行库。安装包未做发布者证书签名。
- Android：`android-test.apk` 使用调试证书签名，仅供测试。可在允许安装该 APK 的测试设备上打开，或使用 `adb install <APK路径>`。若设备已有不同签名的同 ID 应用，无法覆盖安装；卸载旧应用可能删除存档，请先备份。
- iOS：解压 `ios-simulator-universal.zip`，启动 Xcode 模拟器，把 `Runner.app` 拖进去，或运行 `xcrun simctl install booted /path/to/Runner.app`。开发构建仅用于模拟器，不能装到实体 iPhone，也不能提交 App Store。
- 游戏离线运行，按方向键／WASD 移动，Z 撤销，Esc 菜单。存档保存在应用的本地用户数据中，与 Vue／Electron 版不自动同步。卸载程序不主动删除游戏存档。
- `SHA256SUMS.txt` 为下载完整性校验。Mac 可用 `shasum -a 256 文件名`，Windows PowerShell 可用 `Get-FileHash 文件名 -Algorithm SHA256`。
