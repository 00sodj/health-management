import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind 类名，自动去重冲突类（shadcn/ui 标准 cn）。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
