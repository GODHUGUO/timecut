export type PopupType = 'success' | 'error' | 'warning' | 'info'

export interface PopupItem {
  id: number
  message: string
  title?: string
  type: PopupType
}

const DEFAULT_TIMEOUT = 4200

export const usePopup = () => {
  const popups = useState<PopupItem[]>('app-popups', () => [])

  const removePopup = (id: number) => {
    popups.value = popups.value.filter((popup) => popup.id !== id)
  }

  const showPopup = (message: string, type: PopupType = 'info', title?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)

    popups.value = [
      ...popups.value,
      {
        id,
        message,
        title,
        type,
      },
    ]

    if (import.meta.client) {
      window.setTimeout(() => {
        removePopup(id)
      }, DEFAULT_TIMEOUT)
    }

    return id
  }

  return {
    popups,
    removePopup,
    showPopup,
  }
}
