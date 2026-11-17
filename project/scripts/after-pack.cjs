const { execFileSync } = require('node:child_process')
const path = require('node:path')

// 合并 Universal 二进制会使原有签名失效。本地分发包重新做 ad-hoc 签名，
// 无需开发者证书；公开分发仍需 Developer ID 和公证。
module.exports = async ({ electronPlatformName, appOutDir, packager }) => {
  if (electronPlatformName !== 'darwin') return
  const appPath = path.join(appOutDir, `${packager.appInfo.productFilename}.app`)
  execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' })
}
