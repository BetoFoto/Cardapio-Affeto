<script setup lang="ts">
import { onMounted } from 'vue'
import Header from './components/Header.vue'
import PwaPrompt from './components/PwaPrompt.vue'
import { usePwa } from './composables/usePwa'

const pwa = usePwa()

onMounted(() => {
  // Registra o listener para atualizações do SW
  if ('serviceWorker' in navigator) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          pwa.setNeedRefresh(async () => {
            // Força a atualização do SW
            const registration = await navigator.serviceWorker.ready
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        },
        onOfflineReady() {
          pwa.setOfflineReady()
        },
      })
    })
  }
})
</script>

<template>
  <div class="app">
    <a href="#main-content" class="skip-to-content">Pular para o conteúdo</a>
    <Header />
    <main id="main-content">
      <router-view />
    </main>
    <PwaPrompt />
  </div>
</template>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
</style>
