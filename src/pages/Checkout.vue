<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import { useCartStore } from '../store/cart'
import type { Order } from '../types'
import { supabase } from '../lib/supabase'
import Breadcrumbs from '../components/Breadcrumbs.vue'

const cart = useCartStore()
const form = reactive({ name: '', phone: '', address: '', date: '', time: '' })
const valid = computed(() => form.name && form.phone && form.address && form.date && form.time && cart.items.length)

const envWhatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined

const settingsWhatsappNumber = ref<string>('')
const settingsWhatsappTemplate = ref<string>('')

const loadSettings = async () => {
  if (!supabase) return
  const { data, error } = await supabase.from('settings').select('key,value')
  if (error || !data) return
  const map = Object.fromEntries((data as any[]).map((r) => [r.key, r.value]))
  settingsWhatsappNumber.value = map.whatsapp_number || ''
  settingsWhatsappTemplate.value = map.whatsapp_template || ''
}

onMounted(loadSettings)

const whatsappNumber = computed(() => {
  const raw = settingsWhatsappNumber.value || envWhatsappNumber || ''
  const digits = raw.replace(/\D/g, '')
  return digits
})

const itemsText = computed(() =>
  cart.items
    .map(
      (i) =>
        `• ${i.name}${i.sizeLabel ? ' (' + i.sizeLabel + ')' : ''} x${i.quantity} — R$ ${i.subtotal.toFixed(2)}`,
    )
    .join('\n'),
)

const defaultMessage = computed(
  () =>
    `Pedido Affetto\n\nCliente: ${form.name}\nWhatsApp: ${form.phone}\nEndereço: ${form.address}\nData: ${form.date}\nHorário: ${form.time}\n\nItens:\n${itemsText.value}\n\nTotal: R$ ${cart.total.toFixed(2)}`,
)

const message = computed(() => {
  const template = settingsWhatsappTemplate.value?.trim()
  if (!template) return defaultMessage.value
  return template
    .replace('{{cliente}}', form.name)
    .replace('{{whatsapp}}', form.phone)
    .replace('{{endereco}}', form.address)
    .replace('{{data}}', form.date)
    .replace('{{hora}}', form.time)
    .replace('{{itens}}', itemsText.value)
    .replace('{{total}}', `R$ ${cart.total.toFixed(2)}`)
})

const send = async () => {
  if (!valid.value) return
  if (!navigator.onLine) {
    alert('Você está offline. Conecte-se à internet para enviar o pedido pelo WhatsApp.')
    return
  }
  if (!whatsappNumber.value) {
    alert('Número de WhatsApp não configurado. Verifique as configurações da loja.')
    return
  }
  const url = `https://api.whatsapp.com/send?phone=${whatsappNumber.value}&text=${encodeURIComponent(message.value)}`
  window.open(url, '_blank')
  if (supabase) {
    const now = new Date()
    const ordNumber = `AFF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const order: Order = {
      order_number: ordNumber,
      customer_name: form.name,
      customer_whatsapp: form.phone,
      customer_address: form.address,
      delivery_date: form.date,
      delivery_time: form.time,
      subtotal: cart.total,
      total: cart.total,
      status: 'pending',
    }
    const { data: created, error } = await supabase
      .from('orders')
      .insert(order)
      .select('id')
      .single()
    if (!error && created?.id) {
      const items = cart.items.map((i) => ({
        order_id: created.id,
        product_id: i.productId,
        product_name: i.name,
        product_size: i.sizeLabel || null,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        subtotal: i.subtotal,
      }))
      await supabase.from('order_items').insert(items)
    }
  }
  cart.clear()
  alert('Pedido enviado! Vamos entrar em contato para confirmar.')
}
</script>

<template>
  <div class="checkout-root">
    <div class="wrap">
      <Breadcrumbs />
      <h2 class="title">Finalize seu Pedido</h2>

      <div class="layout" v-if="cart.items.length">
        <section class="summary">
          <h3 class="summary-title">Seu pedido de Natal</h3>
          <div class="items">
            <div v-for="(item, idx) in cart.items" :key="idx" class="item-row">
              <div class="item-main">
                <div class="thumb-wrap" v-if="item.image_url">
                  <img :src="item.image_url" class="thumb" :alt="item.name" />
                </div>
                <div class="info">
                  <div class="name">
                    {{ item.name }}
                    <span v-if="item.sizeLabel" class="size">• {{ item.sizeLabel }}</span>
                  </div>
                  <div class="meta">Quantidade: {{ item.quantity }}</div>
                </div>
              </div>
              <div class="price">R$ {{ item.subtotal.toFixed(2) }}</div>
            </div>
          </div>
          <div class="totals">
            <div class="row">
              <span>Subtotal</span>
              <span>R$ {{ cart.total.toFixed(2) }}</span>
            </div>
            <div class="row grand">
              <span>Total do pedido</span>
              <span>R$ {{ cart.total.toFixed(2) }}</span>
            </div>
          </div>
        </section>

        <section class="form-card">
          <h3 class="form-title">Dados para entrega e contato</h3>
          <form class="form" @submit.prevent="send">
            <label>
              <span>Nome completo</span>
              <input v-model="form.name" required />
            </label>
            <label>
              <span>WhatsApp</span>
              <input v-model="form.phone" placeholder="(00) 00000-0000" required />
            </label>
            <label>
              <span>Endereço de entrega</span>
              <input v-model="form.address" placeholder="Rua, número, complemento" required />
            </label>
            <div class="row-2">
              <label>
                <span>Data preferida</span>
                <input type="date" v-model="form.date" required />
              </label>
              <label>
                <span>Horário</span>
                <input type="time" v-model="form.time" required />
              </label>
            </div>
            <button class="btn primary" :disabled="!valid" type="submit">
              Confirmar e enviar via WhatsApp
            </button>
          </form>
        </section>
      </div>

      <div v-else class="empty">
        <p>Seu carrinho está vazio. Adicione itens ao pedido antes de finalizar.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-root {
  min-height: calc(100vh - 60px);
  background: #f4f2f0;
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

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.4fr);
  gap: 16px;
}

.summary {
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 18px 16px;
  border: 1px solid #e5e7eb;
}

.summary-title {
  margin: 0 0 12px;
  font-size: 18px;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.item-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.thumb-wrap {
  width: 48px;
  height: 48px;
  border-radius: 999px;
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
  font-weight: 600;
}

.size {
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

.totals {
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totals .row {
  display: flex;
  justify-content: space-between;
}

.totals .grand span:last-child {
  color: #b91c1c;
}

.form-card {
  background: #fefce8;
  border-radius: 18px;
  padding: 18px 18px 16px;
  border: 1px solid #e5e7eb;
}

.form-title {
  margin: 0 0 12px;
  font-size: 18px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.row-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.btn {
  margin-top: 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 10px 14px;
  font-size: 14px;
  background: #ffffff;
  cursor: pointer;
}

.primary {
  background: #ea2a33;
  border-color: #ea2a33;
  color: #ffffff;
  font-weight: 700;
}

button[disabled] {
  opacity: 0.6;
  cursor: default;
}

.empty {
  margin-top: 24px;
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 18px 16px;
  border: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>