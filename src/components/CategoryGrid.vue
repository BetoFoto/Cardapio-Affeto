<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'

type UIGridCat = { slug: string; label: string; img?: string }
const categories = ref<UIGridCat[]>([])
const loading = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  if (!supabase) {
    loading.value = false
    return
  }
  const { data, error } = await supabase
    .from('categories')
    .select('slug,name,image_url,active,display_order')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) errorMsg.value = 'Erro ao carregar categorias'
  categories.value = (data || []).map((c: any) => ({ slug: c.slug, label: c.name, img: c.image_url }))
  loading.value = false
})
</script>

<template>
  <div v-if="loading">Carregando categorias...</div>
  <div v-else>
    <div v-if="!errorMsg" class="catGrid">
      <router-link v-for="c in categories" :key="c.slug" class="catCard" :to="`/categoria/${c.slug}`" :aria-label="c.label">
        <div class="img" :style="{ backgroundImage: `url(${c.img || ''})` }"></div>
        <div class="label">{{ c.label }}</div>
      </router-link>
    </div>
    <div v-else class="hint">{{ errorMsg }}</div>
    <div class="hint" v-if="!errorMsg">Explore nosso cardápio</div>
  </div>
</template>

<style scoped>
.catGrid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; justify-items: stretch; padding: 0; width: 100% }
@media (min-width: 768px) { .catGrid { grid-template-columns: repeat(4, minmax(0, 1fr)) } }
.catCard { display: block; width: 100%; position: relative; background: #f7f7f7; border-radius: 14px; overflow: hidden; color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.06) }
.catCard .content { display: flex; flex-direction: column }
.img { width: 100%; aspect-ratio: 1 / 1; background-size: cover; background-position: center; transition: transform .2s ease-out, filter .2s ease-out }
.catCard::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55)); pointer-events: none; z-index: 0 }
.label { position: absolute; bottom: 10px; left: 10px; right: 10px; color: #fff; font-weight: 700; font-size: 18px; text-shadow: 0 1px 2px rgba(0,0,0,.4); z-index: 1 }
.catCard:hover .img { transform: scale(1.03); filter: brightness(.95) }
.hint { margin-top: 12px; color: #666; text-align: center }
</style>