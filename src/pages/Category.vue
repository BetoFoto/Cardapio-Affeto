<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const products = ref<Product[]>([])
const loading = ref(true)
const errorMsg = ref('')
const slug = route.params.slug as string
const categoryName = ref('')

onMounted(async () => {
  if (!supabase) {
    errorMsg.value = 'Conexão com banco não configurada'
    loading.value = false
    return
  }
  // 1) Buscar categoria pelo slug
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('id,name')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()
  if (catErr || !cat) {
    errorMsg.value = 'Categoria não encontrada'
    loading.value = false
    return
  }
  categoryName.value = cat.name
  // 2) Buscar produtos por category_id
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('category_id', cat.id)
    .order('name', { ascending: true })
  if (error) errorMsg.value = 'Erro ao buscar produtos'
  products.value = (data || []) as Product[]
  loading.value = false
})
</script>

<template>
  <div class="category-root">
    <div class="wrap">
      <div class="category-card">
        <header class="category-header">
          <Breadcrumbs />
          <h2 class="title">{{ categoryName || slug.replace('-', ' ') }}</h2>
        </header>
        <div v-if="loading" class="state">Carregando...</div>
        <div v-else-if="!errorMsg">
          <div v-if="products.length" class="grid">
            <ProductCard v-for="p in products" :key="p.id" :product="p" />
          </div>
          <div v-else class="state">Nenhum produto disponível.</div>
        </div>
        <div v-else class="state">{{ errorMsg }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-root {
  min-height: calc(100vh - 60px);
  background: #f4f2f0;
}

.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

.category-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 18px 18px 20px;
  border: 1px solid #e3d8d3;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
}

.category-header {
  margin-bottom: 12px;
}

.title {
  margin: 4px 0 0;
  font-size: 22px;
  text-transform: capitalize;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.state {
  color: #666;
  font-size: 14px;
}

@media (max-width: 640px) {
  .category-card {
    border-radius: 18px;
    padding: 16px 14px 18px;
  }

  .title {
    font-size: 20px;
  }
}
</style>