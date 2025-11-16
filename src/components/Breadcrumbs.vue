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
.breadcrumbs { display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; margin: 8px 0 }
.crumb { cursor: pointer }
.sep { color: #aaa }
.current { font-weight: 600; color: #000 }
</style>