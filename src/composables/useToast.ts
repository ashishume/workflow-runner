import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

// Global toast state (singleton)
const toasts = ref<ToastItem[]>([])
let nextId = 0

export function useToast() {
  const show = (
    message: string,
    type: ToastItem['type'] = 'info',
    duration: number = 3000
  ) => {
    const id = nextId++
    const toast: ToastItem = { id, message, type, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  const dismiss = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => show(message, 'success', duration)
  const error = (message: string, duration?: number) => show(message, 'error', duration)
  const warning = (message: string, duration?: number) => show(message, 'warning', duration)
  const info = (message: string, duration?: number) => show(message, 'info', duration)

  return {
    toasts,
    show,
    dismiss,
    success,
    error,
    warning,
    info,
  }
}
