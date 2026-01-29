<script setup lang="ts">
defineProps<{
  message: string
  retrying?: boolean
  showRetry?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const handleRetry = () => {
  emit('retry')
}
</script>

<template>
  <div class="error-state" role="alert" aria-live="assertive">
    <div class="error-icon">⚠️</div>
    <p class="error-message">{{ message }}</p>
    <button
      v-if="showRetry"
      class="retry-btn"
      @click="handleRetry"
      :disabled="retrying"
      aria-label="Tentar novamente"
    >
      <span v-if="retrying" class="spinner" aria-hidden="true"></span>
      <span>{{ retrying ? 'Tentando...' : 'Tentar novamente' }}</span>
    </button>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background: var(--accent-light);
  border: 1px solid var(--accent-primary);
  border-radius: 0.75rem;
  margin: 1rem 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.error-message {
  color: var(--accent-primary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  max-width: 400px;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.retry-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
