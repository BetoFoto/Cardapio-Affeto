<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import type { BuffetProduct } from '../types'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import ProductCard from '../components/ProductCard.vue'
import ErrorState from '../components/ErrorState.vue'
import { useSupabaseWithRetry } from '../composables/useSupabaseWithRetry'

const route = useRoute()
const slug = route.params.slug as string
const categoryName = ref('')
const categoryId = ref<string | null>(null)

const { state: categoryState, execute: executeCategory } = useSupabaseWithRetry<any>()
const { state: productsState, execute: executeProducts } = useSupabaseWithRetry<BuffetProduct[]>()

const loading = ref(true)

const loadData = async () => {
  loading.value = true

  if (!supabase) {
    loading.value = false
    return
  }

  // 1) Buscar categoria pelo slug
  const cat = await executeCategory(async () => {
    return await supabase!
      .from('categories')
      .select('id,name')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle()
  })

  if (!cat) {
    loading.value = false
    return
  }

  categoryId.value = cat.id
  categoryName.value = cat.name

  // 2) Buscar produtos com price_tiers
  await executeProducts(async () => {
    return await supabase!
      .from('products')
      .select('*, price_tiers(*)')
      .eq('active', true)
      .eq('category_id', cat.id)
      .order('name', { ascending: true })
  })

  loading.value = false
}

onMounted(loadData)

const handleRetry = () => {
  loadData()
}
</script>

<template>
  <div class="category-root">
    <div class="wrap">
      <div class="category-card">
        <header class="category-header">
          <Breadcrumbs />
          <h2 class="title">{{ categoryName || slug.replace('-', ' ') }}</h2>
        </header>

        <!-- Loading State -->
        <div v-if="loading || productsState.loading" class="state" role="status" aria-live="polite">
          <span class="spinner" aria-hidden="true"></span>
          Carregando...
        </div>

        <!-- Error State -->
        <ErrorState
          v-else-if="categoryState.error"
          :message="categoryState.error"
          :retrying="categoryState.retrying"
          show-retry
          @retry="handleRetry"
        />
        <ErrorState
          v-else-if="productsState.error"
          :message="productsState.error"
          :retrying="productsState.retrying"
          show-retry
          @retry="handleRetry"
        />

        <!-- Success State -->
        <div v-else>
          <div v-if="productsState.data?.length" class="grid">
            <ProductCard v-for="p in productsState.data" :key="p.id" :product="p" />
          </div>
          <div v-else class="state" role="status">Nenhum produto disponível nesta categoria.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-root {
  min-height: calc(100vh - 60px);
  background: var(--bg-tertiary);
  transition: background-color 0.3s ease;
}

.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

.category-card {
  background: var(--bg-card);
  border-radius: 24px;
  padding: 18px 18px 20px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.category-header {
  margin-bottom: 12px;
}

.title {
  margin: 4px 0 0;
  font-size: 22px;
  text-transform: capitalize;
  color: var(--text-primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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