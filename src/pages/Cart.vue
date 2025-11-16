<script setup lang="ts">
import { useCartStore } from '../store/cart'
import { useRouter } from 'vue-router'
import Breadcrumbs from '../components/Breadcrumbs.vue'
const cart = useCartStore()
const router = useRouter()
const goMenu = () => router.push('/')
const goCheckout = () => router.push('/checkout')

const onQtyInput = (evt: Event, idx: number) => {
  const val = Number((evt.target as HTMLInputElement).value)
  cart.updateQuantity(idx, val)
}

const decQty = (idx: number) => {
  const item = cart.items[idx]
  if (!item) return
  cart.updateQuantity(idx, item.quantity - 1)
}

const incQty = (idx: number) => {
  const item = cart.items[idx]
  if (!item) return
  cart.updateQuantity(idx, item.quantity + 1)
}
</script>

<template>
  <div class="cart-root">
    <div class="wrap">
      <Breadcrumbs />
      <h2 class="title">Revise seu Pedido de Natal</h2>

      <div v-if="!cart.items.length" class="empty">
        <p>Seu carrinho está vazio.</p>
        <button class="btn outline" @click="goMenu">Voltar ao Cardápio</button>
      </div>

      <div v-else class="layout">
        <section class="items">
          <div
            v-for="(item, idx) in cart.items"
            :key="idx"
            class="item-card"
          >
            <div class="item-main">
              <div class="thumb-wrap" v-if="item.image_url">
                <img :src="item.image_url" class="thumb" :alt="item.name" />
              </div>
              <div class="info">
                <div class="name">
                  {{ item.name }}
                  <span v-if="item.sizeLabel" class="size">• {{ item.sizeLabel }}</span>
                </div>
                <div class="meta">R$ {{ item.unitPrice.toFixed(2) }} / unidade</div>
              </div>
              <div class="price">R$ {{ item.subtotal.toFixed(2) }}</div>
            </div>
            <div class="item-footer">
              <div class="qty">
                <input
                  type="number"
                  min="1"
                  :value="item.quantity"
                  @input="onQtyInput($event, idx)"
                />
                <button type="button" class="qty-btn" @click="decQty(idx)">−</button>
                <button type="button" class="qty-btn" @click="incQty(idx)">+</button>
              </div>
              <button type="button" class="icon-btn" @click="cart.remove(idx)">🗑</button>
            </div>
          </div>
        </section>

        <aside class="summary">
          <h3>Resumo do Pedido</h3>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>R$ {{ cart.total.toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total do Pedido</span>
            <span>R$ {{ cart.total.toFixed(2) }}</span>
          </div>
          <button class="btn primary full" @click="goCheckout">
            Finalizar e Enviar via WhatsApp
          </button>
          <button class="btn ghost full" @click="goMenu">Voltar ao Cardápio</button>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-root {
  min-height: calc(100vh - 60px);
  background: #fef2f2;
}

.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

.title {
  margin: 8px 0 16px;
  font-size: 24px;
}

.empty {
  margin-top: 24px;
  background: #ffffff;
  border-radius: 18px;
  padding: 24px 20px;
  border: 1px solid #f1e9e5;
  text-align: center;
  color: #4b5563;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(260px, 1fr);
  gap: 16px;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 10px 14px;
  border: 1px solid #f1e9e5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.thumb-wrap {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-weight: 700;
  font-size: 15px;
}

.size {
  font-weight: 500;
  font-size: 13px;
  color: #6b7280;
}

.meta {
  font-size: 13px;
  color: #6b7280;
}

.price {
  font-weight: 700;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qty {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty input {
  width: 56px;
  padding: 4px 6px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

.summary {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 18px;
  border: 1px solid #f1e9e5;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary-row.total span:last-child {
  color: #ea2a33;
  font-weight: 700;
}

.btn {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 8px 14px;
  font-size: 13px;
  background: #ffffff;
  cursor: pointer;
}

.btn.full {
  width: 100%;
}

.btn.primary {
  background: #ea2a33;
  border-color: #ea2a33;
  color: #ffffff;
  font-weight: 700;
}

.btn.ghost {
  background: #f9fafb;
}

.btn.outline {
  border-color: #d1d5db;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>