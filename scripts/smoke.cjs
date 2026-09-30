// UI 冒烟测试：加载生产产物，检查渲染与各 Tab 切换
const { app, BrowserWindow } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const DIST = path.join(__dirname, '..', 'dist')
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon',
}
const CSP = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "script-src 'self'",
  "worker-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self' data:", "manifest-src 'self'", "connect-src 'self' https: http:", "form-action 'self'",
].join('; ')

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Security-Policy', CSP)
      let p = decodeURIComponent((req.url || '/').split('?')[0])
      if (p === '/') p = '/index.html'
      const fp = path.normalize(path.join(DIST, p))
      if (!fp.startsWith(DIST)) { res.statusCode = 403; return res.end('x') }
      fs.readFile(fp, (err, data) => {
        if (err) { res.statusCode = 404; return res.end('nf') }
        res.setHeader('Content-Type', MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream')
        res.end(data)
      })
    })
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const port = await startServer()
  const win = new BrowserWindow({
    show: false,
    width: 420, height: 880,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  const logs = []
  win.webContents.on('console-message', (_e, lvl, msg) => logs.push(`[lvl${lvl}] ${msg}`))
  win.webContents.on('did-fail-load', (_e, c, d, u) => logs.push(`FAIL_LOAD ${c} ${d} ${u}`))
  win.webContents.on('did-finish-load', () => logs.push('DID_FINISH_LOAD'))
  await win.loadURL(`http://127.0.0.1:${port}/`)
  await wait(1500)

  const step = (js) => win.webContents.executeJavaScript(js)
  const out = []
  out.push('TITLE=' + (await step('document.title')))
  out.push('ROOT_LEN=' + (await step("document.getElementById('root')?document.getElementById('root').innerHTML.length:-1")))
  out.push('TABS_FOUND=' + (await step("['今日','饮食','运动','睡眠','我的'].filter(t=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===t)).join(',')")))

  const tabs = [
    ['饮食', '早餐'],
    ['运动', '运动总消耗'],
    ['计划', '训练计划'],
    ['睡眠', '睡眠'],
    ['我的', '身体资料'],
    ['今日', '今日'],
  ]
  for (const [tab, expect] of tabs) {
    const clicked = await step(
      `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(tab)});if(!b)return false;b.click();return true})()`,
    )
    await wait(500)
    const txt = await step('document.body.innerText')
    out.push(`TAB ${tab}: clicked=${clicked} contains「${expect}」=${txt.includes(expect)}`)
  }

  // 趋势图：热量与睡眠应分成两张独立图
  await wait(700)
  const todayTxt = await step('document.body.innerText')
  out.push(
    `趋势图分区: 热量图=${todayTxt.includes('热量（kcal）')} 睡眠图=${todayTxt.includes('睡眠（小时）')}`,
  )
  out.push(`体重保存按钮: ${todayTxt.includes('体重') && todayTxt.includes('保存')}`)
  out.push(`AI建议入口: ${todayTxt.includes('AI 分析')}`)

  // 计划页：打卡模块（完成度 / 还差多少）
  await step(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='计划');if(b)b.click();return true})()`)
  await wait(500)
  const planTxt = await step('document.body.innerText')
  out.push(
    `计划打卡卡: 标题=${planTxt.includes('今日打卡')} 进度=${planTxt.includes('项已完成') || planTxt.includes('还没有安排')} 整周=${planTxt.includes('整周安排')}`,
  )
  const checkinBtns = await step(
    "[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='打卡').length",
  )
  out.push(`打卡按钮只在所选日期行(数量<=1): ${checkinBtns <= 1} (共${checkinBtns}个)`)

  // 深色模式切换（在「我的」页）
  await step(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='我的');if(b)b.click();return true})()`)
  await wait(400)
  const meTxt = await step('document.body.innerText')
  out.push(
    `目标卡: 碳水=${meTxt.includes('碳水（g）')} 脂肪=${meTxt.includes('脂肪（g）')} 重算按钮=${meTxt.includes('按身体数据重算')}`,
  )
  const darkClicked = await step(
    `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='深色');if(!b)return false;b.click();return true})()`,
  )
  await wait(300)
  out.push(`DARK: clicked=${darkClicked} htmlHasDark=${await step("document.documentElement.classList.contains('dark')")}`)
  await step(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='浅色');if(b)b.click();return true})()`)
  await wait(300)
  out.push(`LIGHT: htmlHasDark=${await step("document.documentElement.classList.contains('dark')")}`)

  // 食物库：营养素标签 + 关闭后重置到列表层
  await step(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='饮食');if(b)b.click();return true})()`)
  await wait(500)
  const openLib = () =>
    step(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('食物库'));if(!b)return false;b.click();return true})()`)
  const libOpened = await openLib()
  await wait(400)
  const editOpened = await step(`(()=>{const b=document.querySelector('button[aria-label="编辑"]');if(!b)return false;b.click();return true})()`)
  await wait(400)
  let t = await step('document.body.innerText')
  out.push(
    `食物库: opened=${libOpened} editOpened=${editOpened} labelsOK=${t.includes('热量（kcal）') && t.includes('蛋白质（g）') && t.includes('编辑食物')}`,
  )
  await step(`(()=>{const b=document.querySelector('button[aria-label="关闭"]');if(b)b.click();return true})()`)
  await wait(400)
  await openLib()
  await wait(400)
  t = await step('document.body.innerText')
  out.push(`食物库重开回到列表(不含"编辑食物")=${!t.includes('编辑食物')}`)

  console.log('=== UI SMOKE ===')
  console.log(out.join('\n'))
  console.log('--- console (should be empty of errors) ---')
  console.log(logs.join('\n') || '(none)')
  app.quit()
})
app.on('window-all-closed', () => app.quit())
