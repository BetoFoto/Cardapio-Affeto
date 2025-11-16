<script setup lang="ts">
import Header from './components/Header.vue'
</script>

<template>
  <div class="app">
    <Header />
    <router-view />
  </div>
</template>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
</style>
