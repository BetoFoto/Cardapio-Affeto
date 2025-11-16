<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCartStore } from '../store/cart'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const cart = useCartStore()
const route = useRoute()
const router = useRouter()
const isAdmin = computed(() => route.path.startsWith('/admin'))
const online = computed(() => navigator.onLine)

const logoUrl = ref<string | null>(null)
const brandName = ref<string>('Affetto')
const topbarMessage = ref<string | null>(null)

const loadLogo = async () => {
  if (!supabase) return
  const { data, error } = await supabase.from('settings').select('key,value')
  if (error || !data) return
  const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
  if (map.logo_url) logoUrl.value = map.logo_url as string
  if (map.brand_name) brandName.value = map.brand_name as string
  if (map.topbar_message) topbarMessage.value = map.topbar_message as string
}

onMounted(loadLogo)

const goCart = () => router.push('/carrinho')
const goHome = () => router.push('/')
</script>

<template>
  <header class="header">
    <div v-if="topbarMessage" class="topbar">
      <div class="topbar-inner">
        <span class="topbar-text">{{ topbarMessage }}</span>
      </div>
    </div>

    <div class="wrap">
      <div class="brand" @click="goHome">
        <span v-if="logoUrl" class="logo-wrapper">
          <img :src="logoUrl" :alt="brandName" />
        </span>
        <span v-else class="icon">❄️</span>
        <span>{{ brandName }}</span>

      </div>

      <nav v-if="!isAdmin" class="nav">
        <button class="cta" @click="goCart">Ver meu Pedido <span class="cartIcon">🛒</span><span class="badge" v-if="cart.count">{{ cart.count }}</span></button>
        <span class="offline" v-if="!online">Offline</span>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header { position: sticky; top: 0; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; z-index: 50 }
.topbar { background: #2f2933; color: #fef4e6; font-size: 12px; }
.topbar-inner { max-width: 1080px; margin: 0 auto; padding: 4px 16px; text-align: center; }
.topbar-text { display: inline-block; }
.wrap { display: flex; align-items: center; justify-content: space-between; max-width: 1080px; margin: 0 auto; padding: 12px 16px }
.brand { font-weight: 700; font-size: 16px; cursor: pointer; color: #111827; display: flex; align-items: center; gap: 8px }
.logo-wrapper { display: inline-flex; align-items: center; justify-content: center; height: 70px }
.logo-wrapper img { max-height: 70px; max-width: 260px; object-fit: contain }

.cta { background: #f7d87c; color: #4a3b16; border: 1px solid #e6c766; padding: 8px 12px; border-radius: 10px }
.cartIcon { margin-left: 8px }
.badge { background: #b31919; color: #fff; border-radius: 999px; padding: 2px 8px; margin-left: 6px; font-size: 12px }
.offline { margin-left: 12px; color: #b31919 }
</style>