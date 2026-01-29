import { ref, onMounted, onUnmounted } from 'vue'

interface PwaState {
  isOnline: boolean
  needRefresh: boolean
  offlineReady: boolean
}

const state = ref<PwaState>({
  isOnline: navigator.onLine,
  needRefresh: false,
  offlineReady: false,
})

let updateServiceWorker: (() => Promise<void>) | null = null

export function usePwa() {
  const updateOnlineStatus = () => {
    const wasOffline = !state.value.isOnline
    state.value.isOnline = navigator.onLine

    // Quando volta a ficar online, pode sincronizar
    if (state.value.isOnline && wasOffline) {
      window.dispatchEvent(new CustomEvent('app:online'))
    }
  }

  const closeRefreshPrompt = () => {
    state.value.needRefresh = false
  }

  const updateApp = async () => {
    if (updateServiceWorker) {
      await updateServiceWorker()
      window.location.reload()
    }
  }

  const setOfflineReady = () => {
    state.value.offlineReady = true
  }

  const setNeedRefresh = (callback: () => Promise<void>) => {
    state.value.needRefresh = true
    updateServiceWorker = callback
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Registra listener para atualizações do SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return {
    isOnline: () => state.value.isOnline,
    needRefresh: () => state.value.needRefresh,
    offlineReady: () => state.value.offlineReady,
    closeRefreshPrompt,
    updateApp,
    setOfflineReady,
    setNeedRefresh,
  }
}
