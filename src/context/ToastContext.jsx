import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const addToast = useCallback((message, type = 'success') => {
    const id = ++nextId.current
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 3500)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {/* Toast stack — fixed bottom-right */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-xs sm:max-w-sm"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-sm text-white ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900'
            }`}
          >
            <span className="shrink-0 mt-px font-bold">
              {toast.type === 'error' ? '✕' : '✓'}
            </span>
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none mt-px transition-opacity"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const fn = useContext(ToastContext)
  if (!fn) throw new Error('useToast must be used inside <ToastProvider>')
  return fn
}
