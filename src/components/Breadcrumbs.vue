<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const parts = route.path.split('/').filter(Boolean)
const trail = parts.map((p, i) => ({ label: decodeURIComponent(p), path: '/' + parts.slice(0, i + 1).join('/') }))
const go = (p: string) => router.push(p)
</script>

<template>
  <div class="breadcrumbs">
    <span class="crumb" @click="go('/')">Início</span>
    <template v-for="(t, idx) in trail" :key="t.path">
      <span class="sep">/</span>
      <span class="crumb" :class="{ current: idx === trail.length - 1 }" @click="go(t.path)">{{ t.label }}</span>
    </template>
  </div>
</template>

<style scoped>
.breadcrumbs { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  color: var(--text-muted); 
  font-size: 14px; 
  margin: 8px 0;
}
.crumb { cursor: pointer; transition: color 0.2s ease; }
.crumb:hover { color: var(--accent-primary); }
.sep { color: var(--text-muted); opacity: 0.6; }
.current { font-weight: 600; color: var(--text-primary); }
</style>