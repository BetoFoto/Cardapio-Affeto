<script setup lang="ts">
import type { Product, SizeOption } from '../types'
import { useCartStore } from '../store/cart'
import { computed } from 'vue'

const props = defineProps<{ product: Product }>()
const cart = useCartStore()
const selectSize = (s: SizeOption) => cart.add(props.product, s)
const add = () => cart.add(props.product)

const sizes = computed<SizeOption[] | null>(() => {
  const p = props.product
  if (!p.has_size_options) return null
  const arr: SizeOption[] = []
  if (p.size_5p_price != null) arr.push({ label: '5p', price: Number(p.size_5p_price) })
  if (p.size_10p_price != null) arr.push({ label: '10p', price: Number(p.size_10p_price) })
  return arr.length ? arr : null
})

const inCart = computed(() => {
  const p = props.product
  // consideramos "adicionado" quando existe item desse produto sem tamanho específico
  return cart.items.some((i) => i.productId === p.id && !i.sizeLabel)
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
      <div class="price" v-if="!sizes && product.base_price != null">R$ {{ Number(product.base_price).toFixed(2) }}</div>
      <div v-if="sizes" class="sizes">
        <button
          v-for="s in sizes"
          :key="s.label"
          class="btn size-btn"
          type="button"
          @click="selectSize(s)"
        >
          {{ s.label }} • R$ {{ s.price.toFixed(2) }}
        </button>
      </div>
      <button
        v-else
        :class="['btn', inCart ? 'secondary' : 'primary']"
        type="button"
        @click="!inCart && add()"
      >
        <span v-if="!inCart">Adicionar ao Carrinho</span>
        <span v-else>Adicionado</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid #f1e9e5;
}

.img-wrap {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 */
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
}

.desc {
  color: #6b7280;
  font-size: 13px;
  min-height: 2.6em;
}

.price {
  color: #111827;
  font-weight: 700;
  margin-top: 2px;
}

.sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.btn {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  font-size: 13px;
  background: #ffffff;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}

.size-btn {
  background: #f9fafb;
}

.primary {
  margin-top: 10px;
  width: 100%;
  justify-content: center;
  background: #ea2a33;
  border-color: #ea2a33;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
}

.btn:hover {
  background: #f3f4f6;
}

.primary:hover {
  background: #d1151e;
}
</style>