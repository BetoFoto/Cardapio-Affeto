<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import ErrorState from './ErrorState.vue'
import { useSupabaseWithRetry } from '../composables/useSupabaseWithRetry'

type UIGridCat = { slug: string; label: string; img?: string }
const categories = ref<UIGridCat[]>([])
const { state, execute } = useSupabaseWithRetry<any[]>()

const loadCategories = async () => {
  if (!supabase) return

  const data = await execute(async () => {
    return await supabase!
      .from('categories')
      .select('slug,name,image_url,active,display_order')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
  })

  if (data) {
    categories.value = data.map((c: any) => ({ slug: c.slug, label: c.name, img: c.image_url }))
  }
}

onMounted(loadCategories)
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="state.loading" class="state" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      Carregando categorias...
    </div>

    <!-- Error -->
    <ErrorState
      v-else-if="state.error"
      :message="state.error"
      :retrying="state.retrying"
      show-retry
      @retry="loadCategories"
    />

    <!-- Success -->
    <div v-else>
      <div v-if="categories.length" class="catGrid">
        <router-link v-for="c in categories" :key="c.slug" class="catCard" :to="`/categoria/${c.slug}`" :aria-label="c.label">
          <div class="img" :style="{ backgroundImage: `url(${c.img || ''})` }"></div>
          <div class="label">{{ c.label }}</div>
        </router-link>
      </div>
      <div v-else class="hint">Nenhuma categoria disponível.</div>
    </div>
  </div>
</template>

<style scoped>
.catGrid { 
  display: grid; 
  gap: 16px; 
  grid-template-columns: repeat(2, minmax(0, 1fr)); 
  align-items: stretch; 
  justify-items: stretch; 
  padding: 0; 
  width: 100%;
}
@media (min-width: 768px) { .catGrid { grid-template-columns: repeat(4, minmax(0, 1fr)) } }

.catCard { 
  display: block; 
  width: 100%; 
  position: relative; 
  background: var(--bg-tertiary); 
  border-radius: 14px; 
  overflow: hidden; 
  color: #fff; 
  box-shadow: var(--shadow-md);
  transition: background-color 0.3s ease;
}

.img { 
  width: 100%; 
  aspect-ratio: 1 / 1; 
  background-size: cover; 
  background-position: center; 
  transition: transform .2s ease-out, filter .2s ease-out;
}

.catCard::after { 
  content: ''; 
  position: absolute; 
  inset: 0; 
  background: linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55)); 
  pointer-events: none; 
  z-index: 0;
}

.label { 
  position: absolute; 
  bottom: 10px; 
  left: 10px; 
  right: 10px; 
  color: #fff; 
  font-weight: 700; 
  font-size: 18px; 
  text-shadow: 0 1px 2px rgba(0,0,0,.4); 
  z-index: 1;
}

.catCard:hover .img { transform: scale(1.03); filter: brightness(.95) }

.hint { 
  margin-top: 12px; 
  color: var(--text-muted); 
  text-align: center;
}

.state { 
  color: var(--text-muted); 
  font-size: 14px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 8px; 
  padding: 2rem;
}

.spinner { 
  display: inline-block; 
  width: 1rem; 
  height: 1rem; 
  border: 2px solid var(--border-color); 
  border-top-color: var(--accent-primary); 
  border-radius: 50%; 
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>