// Electron 主进程 —— 内置极简静态服务器托管 dist/，并做安全加固。
const { app, BrowserWindow, shell, session } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const DIST = path.join(__dirname, '..', 'dist')
const ICON = path.join(__dirname, 'icon.png')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

// 与 Vite 构建时注入的 CSP 保持一致
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "worker-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "manifest-src 'self'",
  "connect-src 'self' https: http:",
  "form-action 'self'",
].join('; ')

/** 是否允许外部打开：仅 http/https */
function isSafeExternal(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // 安全响应头
      res.setHeader('Content-Security-Policy', CSP)
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('Referrer-Policy', 'no-referrer')
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      try {
        let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
        if (urlPath === '/') urlPath = '/index.html'
        const filePath = path.normalize(path.join(DIST, urlPath))
        if (!filePath.startsWith(DIST)) {
          res.statusCode = 403
          return res.end('forbidden')
        }
        fs.readFile(filePath, (err, data) => {
          if (err) {
            // SPA 兜底：未命中的路径返回 index.html
            fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => {
              if (e2) {
                res.statusCode = 404
                return res.end('not found')
              }
              res.setHeader('Content-Type', MIME['.html'])
              res.end(d2)
            })
            return
          }
          res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
          res.end(data)
        })
      } catch (e) {
        res.statusCode = 500
        res.end('error')
      }
    })
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

// 全局：拦截任意 webContents 的导航 / 新窗口
app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternal(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://127.0.0.1')) return
    event.preventDefault()
    if (isSafeExternal(url)) shell.openExternal(url)
  })
  contents.on('will-attach-webview', (event) => event.preventDefault())
})

async function createWindow() {
  const port = await startServer()
  const origin = `http://127.0.0.1:${port}`

  // 默认拒绝一切权限申请（本应用不需要摄像头/定位等）
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
  session.defaultSession.setPermissionCheckHandler(() => false)

  const win = new BrowserWindow({
    width: 420,
    height: 880,
    minWidth: 360,
    minHeight: 600,
    title: '健康管理',
    backgroundColor: '#f5f7fa',
    autoHideMenuBar: true,
    icon: ICON,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  })

  // 生产环境下屏蔽开发者工具快捷键
  win.webContents.on('before-input-event', (event, input) => {
    if (app.isPackaged && input.type === 'keyDown') {
      const k = (input.key || '').toLowerCase()
      const devtoolsCombo = (input.control && input.shift && (k === 'i' || k === 'j' || k === 'c')) || k === 'f12'
      if (devtoolsCombo) event.preventDefault()
    }
  })

  win.loadURL(`${origin}/`)
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
