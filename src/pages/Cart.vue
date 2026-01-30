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

// Verifica se item permite alterar quantidade (faixas não permitem)
const canChangeQty = (idx: number) => {
  const item = cart.items[idx]
  return item && !item.priceTierId
}

// Retorna o preço unitário para exibição
const getDisplayPrice = (item: typeof cart.items[0]) => {
  return item.tierPrice || item.unitPrice || 0
}
</script>

<template>
  <div class="cart-root">
    <div class="wrap">
      <Breadcrumbs />
      <h2 class="title">Seu Pedido</h2>

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
                  <span v-if="item.tierLabel" class="tier-label">• {{ item.tierLabel }}</span>
                  <span v-else-if="item.sizeLabel" class="size">• {{ item.sizeLabel }}</span>
                </div>
                <div class="meta" v-if="!item.tierLabel">
                  R$ {{ getDisplayPrice(item).toFixed(2) }} / unidade
                </div>
                <div class="meta tier-meta" v-else>
                  Pacote para evento
                </div>
              </div>
              <div class="price">R$ {{ item.subtotal.toFixed(2) }}</div>
            </div>
            <div class="item-footer">
              <!-- Controles de quantidade apenas para itens sem faixa -->
              <div class="qty" v-if="canChangeQty(idx)">
                <input
                  type="number"
                  min="1"
                  :value="item.quantity"
                  @input="onQtyInput($event, idx)"
                />
                <button type="button" class="qty-btn" @click="decQty(idx)">−</button>
                <button type="button" class="qty-btn" @click="incQty(idx)">+</button>
              </div>
              <div v-else class="qty-fixed">
                <span class="qty-badge">1x</span>
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
  background: var(--bg-tertiary);
  transition: background-color 0.3s ease;
}

.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

.title {
  margin: 8px 0 16px;
  font-size: 24px;
  color: var(--text-primary);
}

.empty {
  margin-top: 24px;
  background: var(--bg-card);
  border-radius: 18px;
  padding: 24px 20px;
  border: 1px solid var(--border-light);
  text-align: center;
  color: var(--text-secondary);
  transition: background-color 0.3s ease, border-color 0.3s ease;
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
  background: var(--bg-card);
  border-radius: 16px;
  padding: 10px 14px;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
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
  color: var(--text-primary);
}

.size {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-muted);
}

.tier-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--accent-primary);
}

.tier-meta {
  font-style: italic;
}

.meta {
  font-size: 13px;
  color: var(--text-muted);
}

.price {
  font-weight: 700;
  color: var(--text-primary);
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
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.qty-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
}

.qty-fixed {
  display: flex;
  align-items: center;
}

.qty-badge {
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
}

.summary {
  background: var(--bg-card);
  border-radius: 18px;
  padding: 16px 18px;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.summary h3 {
  color: var(--text-primary);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-row.total span:last-child {
  color: var(--accent-primary);
  font-weight: 700;
}

.btn {
  border-radius: 999px;
  border: 1px solid var(--border-color);
  padding: 8px 14px;
  font-size: 13px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn.full {
  width: 100%;
}

.btn.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
  font-weight: 700;
}

.btn.primary:hover {
  background: var(--accent-hover);
}

.btn.ghost {
  background: var(--bg-tertiary);
}

.btn.outline {
  border-color: var(--border-color);
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>