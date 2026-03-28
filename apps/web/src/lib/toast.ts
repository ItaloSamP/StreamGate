import { toast } from 'sonner'

const TOAST_ID = 'streamgate-toast'

type ToastTone = 'success' | 'error' | 'info'

export function showSingletonToast(tone: ToastTone, message: string) {
  if (tone === 'success') {
    toast.success(message, { id: TOAST_ID })
    return
  }

  if (tone === 'error') {
    toast.error(message, { id: TOAST_ID })
    return
  }

  toast(message, { id: TOAST_ID })
}
