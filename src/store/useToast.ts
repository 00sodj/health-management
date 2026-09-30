import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  undo?: () => void
}

interface ToastState {
  toast: ToastItem | null
  /** 显示一条提示（可带撤销回调） */
  show: (message: string, undo?: () => void) => void
  hide: () => void
}

/** 轻提示（含撤销）—— 仅内存态，不持久化 */
export const useToast = create<ToastState>((set) => ({
  toast: null,
  show: (message, undo) =>
    set({ toast: { id: Math.random().toString(36).slice(2), message, undo } }),
  hide: () => set({ toast: null }),
}))
