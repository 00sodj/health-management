import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// 内容安全策略（仅在构建产物中注入，避免影响 dev / HMR）
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
  // 允许访问用户自行配置的 AI 网关（https / 自建 http 网关 / 本机 Ollama），以及同源
  "connect-src 'self' https: http:",
  "form-action 'self'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const tags =
        `  <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n` +
        `    <meta name="referrer" content="no-referrer" />\n`
      return html.replace('</head>', `${tags}  </head>`)
    },
  }
}

// Vite 配置：React 插件 + 路径别名 @ -> ./src
// host/allowedHosts 允许在反向代理（发布/部署）下被外部域名访问
export default defineConfig({
  plugins: [react(), cspPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
  },
  build: {
    // 代码分割：把图表库与基础库拆成独立 chunk，降低首屏体积、便于缓存
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-') || id.includes('react-smooth')) return 'charts'
          if (id.includes('pinyin-pro')) return 'pinyin'
          return 'vendor'
        },
      },
    },
  },
})
