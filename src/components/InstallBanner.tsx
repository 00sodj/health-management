import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'health-managem-install-dismissed'

/** 安装引导浮层：当浏览器允许安装（beforeinstallprompt）时提示安装到桌面。 */
export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1',
  )

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferredPrompt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!deferredPrompt || dismissed) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  const install = async () => {
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div className="px-4 pt-2">
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Download size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-800">把「健康管理」装到桌面</p>
          <p className="text-[11px] text-gray-500">安装后像 App 一样打开，支持离线使用</p>
        </div>
        <Button size="sm" onClick={install}>
          安装
        </Button>
        <button onClick={dismiss} aria-label="关闭" className="shrink-0 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
