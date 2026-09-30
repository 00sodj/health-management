import { useEffect } from 'react'
import { Undo2, X } from 'lucide-react'
import { useToast } from '@/store/useToast'

/** 底部轻提示：删除后 5 秒内可撤销 */
export function UndoToast() {
  const toast = useToast((s) => s.toast)
  const hide = useToast((s) => s.hide)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => hide(), 5000)
    return () => clearTimeout(t)
  }, [toast, hide])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
        <span>{toast.message}</span>
        {toast.undo && (
          <button
            onClick={() => {
              toast.undo?.()
              hide()
            }}
            className="flex items-center gap-1 font-medium text-blue-300"
          >
            <Undo2 size={14} /> 撤销
          </button>
        )}
        <button onClick={hide} className="text-gray-400" aria-label="关闭">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
