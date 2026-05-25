'use client'
import { useState, useCallback } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'warning' | 'error'
}

let nextId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return { toasts, show }
}

export function ToastContainer({ toasts }: { toasts: { id: number; message: string; type: string }[] }) {
  return (
    <div className="fixed bottom-7 right-7 flex flex-col gap-2 z-[200]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
            flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-[13px] font-medium text-white shadow-card-lg
            border-l-4 animate-in slide-in-from-bottom-4 bg-eden-dark
            ${t.type === 'success' ? 'border-eden-green' : t.type === 'warning' ? 'border-eden-orange' : 'border-red-500'}
          `}
        >
          {t.type === 'success' ? '✓' : t.type === 'warning' ? '⚠' : '✕'} {t.message}
        </div>
      ))}
    </div>
  )
}
