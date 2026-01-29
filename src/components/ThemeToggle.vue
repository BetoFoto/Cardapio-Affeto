<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
    :title="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
  >
    <span v-if="isDark" class="icon" aria-hidden="true">☀️</span>
    <span v-else class="icon" aria-hidden="true">🌙</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
}

.theme-toggle:hover {
  background: var(--hover-bg, #f3f4f6);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.icon {
  display: block;
  line-height: 1;
}

/* Dark mode adjustments */
:global(.dark) .theme-toggle {
  border-color: var(--border-color, #374151);
}

:global(.dark) .theme-toggle:hover {
  background: var(--hover-bg, #374151);
}
</style>
