<script setup lang="ts">
import { usePwa } from '../composables/usePwa'

const pwa = usePwa()

const handleUpdate = () => {
  pwa.updateApp()
}

const handleClose = () => {
  pwa.closeRefreshPrompt()
}
</script>

<template>
  <!-- Aviso de Nova Versão -->
  <div v-if="pwa.needRefresh()" class="pwa-prompt" role="alert" aria-live="polite">
    <div class="pwa-content">
      <span class="pwa-icon">🎉</span>
      <span class="pwa-text">Nova versão disponível!</span>
      <button class="pwa-btn primary" @click="handleUpdate" aria-label="Atualizar aplicativo">
        Atualizar agora
      </button>
      <button class="pwa-btn secondary" @click="handleClose" aria-label="Fechar aviso">
        Depois
      </button>
    </div>
  </div>

  <!-- Aviso Offline -->
  <div v-else-if="!pwa.isOnline()" class="pwa-prompt offline" role="status" aria-live="polite">
    <div class="pwa-content">
      <span class="pwa-icon">📡</span>
      <span class="pwa-text">Você está offline. Algumas funcionalidades podem estar limitadas.</span>
    </div>
  </div>

  <!-- Aviso Voltei Online -->
  <div v-else-if="pwa.offlineReady() && pwa.isOnline()" class="pwa-prompt online" role="status" aria-live="polite">
    <div class="pwa-content">
      <span class="pwa-icon">✅</span>
      <span class="pwa-text">Conexão restabelecida!</span>
    </div>
  </div>
</template>

<style scoped>
.pwa-prompt {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 1rem;
  min-width: 320px;
  max-width: 90vw;
  animation: slideUp 0.3s ease-out;
}

.pwa-prompt.offline {
  background: #fef3c7;
  border-color: #f59e0b;
}

.pwa-prompt.online {
  background: #d1fae5;
  border-color: #10b981;
  animation: fadeOut 3s ease-in 2s forwards;
}

.pwa-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pwa-icon {
  font-size: 1.25rem;
}

.pwa-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.pwa-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.pwa-btn.primary {
  background: #b31919;
  color: white;
}

.pwa-btn.primary:hover {
  background: #991515;
}

.pwa-btn.secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.pwa-btn.secondary:hover {
  background: #e5e7eb;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

@media (max-width: 640px) {
  .pwa-prompt {
    left: 1rem;
    right: 1rem;
    transform: none;
    min-width: auto;
  }

  .pwa-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
