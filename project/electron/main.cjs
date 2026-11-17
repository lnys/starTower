// 桌面主进程：仅加载打包的 Vue 页面，游戏规则仍由纯 JS 引擎负责。
const { app, BrowserWindow, Menu, dialog, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')

app.setName('星穹塔')
// 固定存档位置，更新、移动应用后仍然能读取本地进度。
app.setPath('userData', path.join(app.getPath('appData'), 'StarDomeTower'))
const smokeTest = process.argv.includes('--smoke-test')
if (smokeTest) app.setPath('userData', path.join(app.getPath('temp'), `star-dome-smoke-${process.pid}`))
const page = path.join(__dirname, '../dist/index.html')
const pageURL = pathToFileURL(page).href
let win

function createWindow() {
  win = new BrowserWindow({
    title: '星穹塔 · 50 层魔塔', width: 1180, height: 860,
    minWidth: 900, minHeight: 680, backgroundColor: '#08071a', show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => { if (url !== pageURL) event.preventDefault() })
  win.webContents.on('will-attach-webview', (event) => event.preventDefault())
  win.once('ready-to-show', () => win.show())
  win.webContents.on('did-fail-load', (_event, code, message) => {
    console.error(`页面加载失败 ${code}: ${message}`)
    if (smokeTest) app.exit(1)
    else dialog.showErrorBox('游戏启动失败', '游戏资源加载失败，请重新解压或安装应用。')
  })
  win.loadFile(page)
  if (smokeTest) runSmokeTest(win)
}

async function runSmokeTest(window) {
  const timeout = setTimeout(() => app.exit(1), 30000)
  window.webContents.on('render-process-gone', () => app.exit(1))
  window.webContents.once('did-finish-load', async () => {
    try {
      const result = await window.webContents.executeJavaScript(`(async () => {
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        if (!document.querySelector('.menu-btn.primary')) throw new Error('标题页未渲染');
        if (typeof window.require !== 'undefined') throw new Error('渲染进程暴露 Node');
        localStorage.setItem('star-v1:desktop-smoke', 'ok');
        if (localStorage.getItem('star-v1:desktop-smoke') !== 'ok') throw new Error('本地存储不可用');
        localStorage.removeItem('star-v1:desktop-smoke');
        document.querySelector('.menu-btn.primary').click();
        await wait(500);
        if (!document.querySelector('.game')) throw new Error('新游戏未启动');
        const save = JSON.parse(localStorage.getItem('star-v1:slot-auto'));
        if (save?.state?.floor !== 1 || save.state.hero.hp !== 1000) throw new Error('新游戏自动存档异常');
        const bad = [...document.images].filter(i => !i.complete || !i.naturalWidth);
        if (bad.length) throw new Error('图片资源加载失败');
        return { title: document.title, floor: save.state.floor, hp: save.state.hero.hp, images: document.images.length };
      })()`)
      const screenshot = process.env.MOTA_SMOKE_SCREENSHOT
      if (screenshot) fs.writeFileSync(screenshot, (await window.webContents.capturePage()).toPNG())
      console.log('桌面冒烟测试通过：' + JSON.stringify(result))
      clearTimeout(timeout)
      app.exit(0)
    } catch (error) {
      console.error(error)
      clearTimeout(timeout)
      app.exit(1)
    }
  })
}

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus() } })
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    // 完全离线：字体使用系统回退，不加载任何远程资源。
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }))
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform === 'darwin' ? [{ label: '星穹塔', submenu: [{ role: 'about', label: '关于星穹塔' }, { type: 'separator' }, { role: 'hide', label: '隐藏星穹塔' }, { role: 'hideOthers', label: '隐藏其他应用' }, { role: 'unhide', label: '显示全部' }, { type: 'separator' }, { role: 'quit', label: '退出星穹塔' }] }] : []),
      { label: '编辑', submenu: [{ role: 'undo', label: '撤销输入' }, { role: 'redo', label: '重做输入' }, { type: 'separator' }, { role: 'cut', label: '剪切' }, { role: 'copy', label: '复制' }, { role: 'paste', label: '粘贴' }, { role: 'selectAll', label: '全选' }] },
      { label: '窗口', submenu: [{ role: 'togglefullscreen', label: '切换全屏' }, { role: 'minimize', label: '最小化' }, { role: 'close', label: '关闭窗口' }] },
    ]))
    createWindow()
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow() })
  })
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
}
