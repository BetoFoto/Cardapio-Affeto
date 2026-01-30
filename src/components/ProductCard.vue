<script setup lang="ts">
import type { BuffetProduct, SizeOption, PriceTier } from '../types'
import { useCartStore } from '../store/cart'
import { computed } from 'vue'

const props = defineProps<{ product: BuffetProduct }>()
const cart = useCartStore()

// Métodos para adicionar ao carrinho
const selectTier = (tier: PriceTier) => cart.addWithTier(props.product, tier)
const selectSize = (s: SizeOption) => cart.add(props.product, s)
const addUnit = () => cart.addUnit(props.product)

// Faixas de preço (novo modelo)
const priceTiers = computed<PriceTier[] | null>(() => {
  const p = props.product
  if (p.pricing_mode === 'unit') return null
  // Prioriza price_tiers sobre modelo legado (Property 9)
  if (p.price_tiers && p.price_tiers.length > 0) return p.price_tiers
  return null
})

// Verifica se tem preço unitário
const hasUnitPrice = computed(() => {
  const p = props.product
  return p.pricing_mode === 'unit' || p.pricing_mode === 'both'
})

// Opções de tamanho legadas (compatibilidade)
const legacySizes = computed<SizeOption[] | null>(() => {
  const p = props.product
  // Se tem price_tiers, ignora modelo legado (Property 9)
  if (p.price_tiers && p.price_tiers.length > 0) return null
  if (!p.has_size_options) return null
  const arr: SizeOption[] = []
  if (p.size_5p_price != null) arr.push({ label: '5p', price: Number(p.size_5p_price) })
  if (p.size_10p_price != null) arr.push({ label: '10p', price: Number(p.size_10p_price) })
  return arr.length ? arr : null
})

// Verifica se produto unitário já está no carrinho
const inCart = computed(() => {
  const p = props.product
  return cart.items.some((i) => i.productId === p.id && !i.sizeLabel && !i.priceTierId)
})

// Verifica se uma faixa específica está no carrinho
const tierInCart = (tierId: string) => {
  return cart.items.some((i) => i.priceTierId === tierId)
}

// Formata descrição longa preservando quebras de linha
const formattedLongDescription = computed(() => {
  if (!props.product.long_description) return null
  return props.product.long_description
})
</script>

<template>
  <div class="card">
    <div class="img-wrap" v-if="product.image_url">
      <img :src="product.image_url" class="img" :alt="product.name" />
    </div>
    <div class="content">
      <div class="name">{{ product.name }}</div>
      <div class="desc">{{ product.description }}</div>
      
      <!-- Descrição longa com formatação preservada -->
      <div v-if="formattedLongDescription" class="long-desc">
        <pre class="long-desc-text">{{ formattedLongDescription }}</pre>
      </div>
      
      <!-- Observações -->
      <div v-if="product.observations" class="observations">
        <span class="obs-icon">ℹ️</span>
        <span>{{ product.observations }}</span>
      </div>
      
      <!-- Preço unitário (quando não tem faixas nem tamanhos) -->
      <div class="price" v-if="!priceTiers && !legacySizes && product.base_price != null">
        R$ {{ Number(product.base_price).toFixed(2) }}
      </div>
      
      <!-- Faixas de preço (novo modelo) -->
      <div v-if="priceTiers" class="tiers">
        <button
          v-for="tier in priceTiers"
          :key="tier.id"
          :class="['btn', 'tier-btn', tierInCart(tier.id) ? 'tier-added' : '']"
          type="button"
          @click="!tierInCart(tier.id) && selectTier(tier)"
        >
          <span class="tier-label">{{ tier.label }}</span>
          <span class="tier-price">R$ {{ Number(tier.price).toFixed(2) }}</span>
          <span v-if="tierInCart(tier.id)" class="tier-check">✓</span>
        </button>
      </div>
      
      <!-- Opções de tamanho legadas -->
      <div v-else-if="legacySizes" class="sizes">
        <button
          v-for="s in legacySizes"
          :key="s.label"
          class="btn size-btn"
          type="button"
          @click="selectSize(s)"
        >
          {{ s.label }} • R$ {{ s.price.toFixed(2) }}
        </button>
      </div>
      
      <!-- Botão unitário (quando pricing_mode é unit ou both) -->
      <button
        v-else-if="hasUnitPrice || (!priceTiers && !legacySizes)"
        :class="['btn', inCart ? 'secondary' : 'primary']"
        type="button"
        @click="!inCart && addUnit()"
      >
        <span v-if="!inCart">Adicionar ao Carrinho</span>
        <span v-else>Adicionado</span>
      </button>
      
      <!-- Botão unitário adicional quando tem both -->
      <button
        v-if="priceTiers && hasUnitPrice && product.base_price"
        :class="['btn', 'unit-btn', inCart ? 'secondary' : '']"
        type="button"
        @click="!inCart && addUnit()"
      >
        <span v-if="!inCart">Avulso • R$ {{ Number(product.base_price).toFixed(2) }}</span>
        <span v-else>Avulso adicionado ✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--bg-card);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.img-wrap {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  overflow: hidden;
}

.img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
}

.desc {
  color: var(--text-muted);
  font-size: 13px;
  min-height: 2.6em;
}

.long-desc {
  margin-top: 8px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.long-desc-text {
  margin: 0;
  font-family: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.observations {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 10px;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
}

.obs-icon {
  flex-shrink: 0;
}

.price {
  color: var(--text-primary);
  font-weight: 700;
  margin-top: 2px;
}

.tiers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.tier-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.15s ease;
}

.tier-btn:hover:not(.tier-added) {
  border-color: var(--accent-primary);
  background: var(--hover-bg);
}

.tier-added {
  border-color: #22c55e;
  background: #f0fdf4;
}

.tier-label {
  font-weight: 600;
  font-size: 13px;
}

.tier-price {
  font-weight: 700;
  color: var(--accent-primary);
}

.tier-check {
  color: #22c55e;
  font-weight: bold;
}

.sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.btn {
  border-radius: 10px;
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  font-size: 13px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}

.size-btn {
  background: var(--bg-tertiary);
}

.size-btn:hover {
  background: var(--hover-bg);
}

.unit-btn {
  margin-top: 8px;
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px dashed var(--border-color);
}

.unit-btn:hover:not(.secondary) {
  background: var(--hover-bg);
}

.primary {
  margin-top: 10px;
  width: 100%;
  justify-content: center;
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
}

.secondary {
  margin-top: 10px;
  width: 100%;
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

.primary:hover {
  background: var(--accent-hover);
}
</style>
