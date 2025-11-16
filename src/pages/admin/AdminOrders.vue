<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../types'

const orders = ref<Order[]>([])
const query = ref('')
const status = ref<string>('')
const date = ref<string>('')

const selectedOrder = ref<Order | null>(null)
const orderItems = ref<any[]>([])
const loadingDetails = ref(false)

const selectedIds = ref<string[]>([])
const bulkStatus = ref<Order['status'] | ''>('')

const statusCounts = computed(() => {
  const counts: Record<Order['status'], number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  }
  for (const o of orders.value) {
    const s = o.status as Order['status']
    if (s && counts[s] !== undefined) counts[s]++
  }
  return counts
})

const load = async () => {
  if (!supabase) {
    orders.value = []
    return
  }
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  orders.value = (data || []) as Order[]
}
onMounted(load)

const filtered = () => orders.value.filter((o) => {
  const q = query.value.toLowerCase()
  const okQ = !q || o.customer_name.toLowerCase().includes(q)
  const okS = !status.value || o.status === status.value
  const okD = !date.value || o.created_at?.startsWith(date.value)
  return okQ && okS && okD
})

const openDetails = async (o: Order) => {
  if (!supabase) return
  selectedOrder.value = o
  orderItems.value = []
  loadingDetails.value = true
  const { data } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', o.id)
    .order('id', { ascending: true })
  orderItems.value = data || []
  loadingDetails.value = false
}

const closeDetails = () => {
  selectedOrder.value = null
  orderItems.value = []
}

const updateStatus = async (o: Order, s: Order['status']) => {
  if (!supabase) return
  await supabase.from('orders').update({ status: s }).eq('id', o.id)
  await load()
}

const onChangeStatus = (evt: Event, o: Order) => {
  const val = (evt.target as HTMLSelectElement).value as Order['status']
  updateStatus(o, val)
}

const toggleSelectAll = (evt: Event) => {
  const checked = (evt.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = filtered().map((o) => String(o.id))
  } else {
    selectedIds.value = []
  }
}

const applyBulkStatus = async () => {
  if (!supabase || !bulkStatus.value || !selectedIds.value.length) return
  await supabase.from('orders').update({ status: bulkStatus.value }).in('id', selectedIds.value)
  selectedIds.value = []
  bulkStatus.value = ''
  await load()
}

const printSelectedOrder = () => {
  if (!selectedOrder.value) return

  const o = selectedOrder.value
  const itemsHtml = orderItems.value
    .map(
      (it) => `
      <tr>
        <td>${it.product_name}${it.product_size ? ` (${it.product_size})` : ''}</td>
        <td style="text-align:center;">${it.quantity}</td>
        <td style="text-align:right;">R$ ${Number(it.unit_price || 0).toFixed(2)}</td>
        <td style="text-align:right;">R$ ${Number(it.subtotal || 0).toFixed(2)}</td>
      </tr>
    `,
    )
    .join('')

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Pedido ${o.order_number || o.id}</title>
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; color: #111827; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        h2 { font-size: 16px; margin: 16px 0 8px; }
        .section { margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 12px; font-size: 13px; }
        .label { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 4px; }
        th, td { border: 1px solid #d1d5db; padding: 6px 8px; }
        th { background: #f3f4f6; text-align: left; }
        .total-row td { font-weight: 700; }
      </style>
    </head>
    <body>
      <h1>Pedido ${o.order_number || o.id}</h1>
      <div class="section">
        <h2>Dados do cliente</h2>
        <div class="grid">
          <div><span class="label">Cliente:</span> ${o.customer_name}</div>
          <div><span class="label">WhatsApp:</span> ${o.customer_whatsapp}</div>
          <div><span class="label">Endereço:</span> ${o.customer_address}</div>
          <div><span class="label">Data entrega:</span> ${o.delivery_date} ${o.delivery_time}</div>
          <div><span class="label">Status:</span> ${o.status}</div>
          <div><span class="label">Total:</span> R$ ${Number(o.total).toFixed(2)}</div>
        </div>
      </div>
      <div class="section">
        <h2>Itens do pedido</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qtd</th>
              <th style="text-align:right;">Unit.</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="4">Nenhum item encontrado.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td style="text-align:right;">R$ ${Number(o.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
  </html>`

  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
</script>

<template>
  <div class="orders-page">
    <div class="orders-header">
      <div>
        <p class="orders-breadcrumb">Admin • Pedidos</p>
        <h1 class="orders-title">Gestão de pedidos</h1>
        <p class="orders-subtitle">
          Acompanhe os pedidos recebidos pelo site, filtre por status e visualize os detalhes de cada cliente.
        </p>
      </div>
    </div>

    <section class="orders-card">
      <header class="orders-card-header">
        <h2 class="orders-card-title">Pedidos</h2>
        <p class="orders-card-description">Use os filtros para localizar pedidos específicos.</p>
      </header>

      <div class="orders-filters">
        <div class="field-group">
          <label for="orders-search">Buscar cliente</label>
          <input
            id="orders-search"
            v-model="query"
            class="field-input"
            placeholder="Digite o nome do cliente"
          />
        </div>

        <div class="field-group">
          <label for="orders-date">Data</label>
          <input id="orders-date" type="date" v-model="date" class="field-input" />
        </div>

        <div class="field-group">
          <label for="orders-status">Status</label>
          <select id="orders-status" v-model="status" class="field-input">
            <option value="">Todos</option>
            <option value="pending">Novo</option>
            <option value="confirmed">Confirmado</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Pronto</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div class="orders-summary">
        <div class="summary-pill">
          <span class="summary-label">Novos</span>
          <span class="summary-value">{{ statusCounts.pending }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Confirmados</span>
          <span class="summary-value">{{ statusCounts.confirmed }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Preparando</span>
          <span class="summary-value">{{ statusCounts.preparing }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Prontos</span>
          <span class="summary-value">{{ statusCounts.ready }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Entregues</span>
          <span class="summary-value">{{ statusCounts.delivered }}</span>
        </div>
        <div class="summary-pill">
          <span class="summary-label">Cancelados</span>
          <span class="summary-value">{{ statusCounts.cancelled }}</span>
        </div>
      </div>

      <div v-if="filtered().length" class="orders-bulk">
        <label class="bulk-select-all">
          <input
            type="checkbox"
            @change="toggleSelectAll"
            :checked="filtered().length > 0 && filtered().every(o => selectedIds.includes(String(o.id)))"
          />
          <span>Selecionar pedidos exibidos</span>
        </label>

        <div class="bulk-actions">
          <select v-model="bulkStatus" class="field-input small-select">
            <option value="">Alterar status para...</option>
            <option value="pending">Novo</option>
            <option value="confirmed">Confirmado</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Pronto</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <button class="btn" @click="applyBulkStatus" :disabled="!bulkStatus || !selectedIds.length">
            Atualizar selecionados
          </button>
        </div>
      </div>

      <div class="orders-list" v-if="filtered().length">
        <article v-for="o in filtered()" :key="o.id" class="order-row">
          <div class="order-main">
            <div class="order-name">{{ o.customer_name }}</div>
            <div class="order-meta">
              <span class="order-total">Total: R$ {{ o.total.toFixed(2) }}</span>
              <span class="order-date">{{ o.created_at?.slice(0, 10) }}</span>
            </div>
          </div>

          <div class="order-side">
            <div class="order-select">
              <input type="checkbox" :value="String(o.id)" v-model="selectedIds" />
            </div>
            <span class="status-pill" :data-status="o.status">
              {{
                o.status === 'pending'
                  ? 'Novo'
                  : o.status === 'confirmed'
                    ? 'Confirmado'
                    : o.status === 'preparing'
                      ? 'Preparando'
                      : o.status === 'ready'
                        ? 'Pronto'
                        : o.status === 'delivered'
                          ? 'Entregue'
                          : 'Cancelado'
              }}
            </span>

            <div class="order-actions">
              <button class="btn" @click="openDetails(o)">Ver detalhes</button>
              <select :value="o.status" @change="onChangeStatus($event, o)" class="field-input small-select">
                <option value="pending">Novo</option>
                <option value="confirmed">Confirmado</option>
                <option value="preparing">Preparando</option>
                <option value="ready">Pronto</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </article>
      </div>

      <p v-else class="orders-empty">Nenhum pedido encontrado para os filtros selecionados.</p>
    </section>

    <div v-if="selectedOrder" class="modal">
      <div class="modal-box">
        <header class="modal-header">
          <h3>Pedido #{{ selectedOrder.id }}</h3>
          <button class="modal-close" @click="closeDetails">×</button>
        </header>

        <section class="modal-section">
          <h4>Dados do cliente</h4>
          <div class="details">
            <div><strong>Cliente:</strong> {{ selectedOrder.customer_name }}</div>
            <div><strong>WhatsApp:</strong> {{ selectedOrder.customer_whatsapp }}</div>
            <div><strong>Endereço:</strong> {{ selectedOrder.customer_address }}</div>
            <div><strong>Data entrega:</strong> {{ selectedOrder.delivery_date }} {{ selectedOrder.delivery_time }}</div>
            <div><strong>Status:</strong> {{ selectedOrder.status }}</div>
            <div><strong>Total:</strong> R$ {{ selectedOrder.total.toFixed(2) }}</div>
          </div>
        </section>

        <section class="modal-section">
          <h4>Itens do pedido</h4>
          <div v-if="loadingDetails">Carregando itens...</div>
          <div v-else>
            <div v-if="!orderItems.length">Nenhum item encontrado para este pedido.</div>
            <div v-else class="items-list">
              <div v-for="it in orderItems" :key="it.id" class="item-row">
                <div class="item-name">
                  {{ it.product_name }}
                  <span v-if="it.product_size">({{ it.product_size }})</span>
                </div>
                <div class="item-meta">Qtd: {{ it.quantity }} • Unit: R$ {{ it.unit_price.toFixed(2) }}</div>
                <div class="item-subtotal">Subtotal: R$ {{ it.subtotal.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </section>

        <footer class="modal-actions">
          <button class="btn" @click="closeDetails">Fechar</button>
          <button class="btn" @click="printSelectedOrder">Imprimir pedido</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px 32px;
}

.orders-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.orders-breadcrumb {
  font-size: 13px;
  color: #8b5b3e;
  margin: 0 0 4px;
}

.orders-title {
  font-size: 24px;
  font-weight: 700;
  color: #3b2b2b;
  margin: 0 0 4px;
}

.orders-subtitle {
  font-size: 14px;
  color: #6b5b4b;
  margin: 0;
}

.orders-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 18px 18px;
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.orders-card-header {
  margin-bottom: 12px;
}

.orders-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #3b2b2b;
}

.orders-card-description {
  margin: 2px 0 0;
  font-size: 13px;
  color: #6b5b4b;
}

.orders-filters {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px 14px;
  margin-top: 12px;
  margin-bottom: 16px;
}

.orders-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fdf8f4;
  border: 1px solid #e5d4c8;
  font-size: 12px;
}

.summary-label {
  color: #6b5b4b;
}

.summary-value {
  font-weight: 600;
  color: #3b2b2b;
}

.orders-bulk {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  flex-wrap: wrap;
}

.bulk-select-all {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-group label {
  font-size: 12px;
  font-weight: 500;
  color: #4b3b3b;
}

.field-input {
  border-radius: 10px;
  border: 1px solid #d4c8bc;
  padding: 8px 10px;
  font-size: 14px;
}

.field-input.small-select {
  padding-inline: 8px;
  font-size: 13px;
}

.orders-list {
  display: grid;
  gap: 10px;
}

.orders-empty {
  margin-top: 8px;
  font-size: 13px;
  color: #6b5b4b;
}

.order-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.6fr);
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5d4c8;
  background: #fdf8f4;
}

.order-name {
  font-weight: 600;
  color: #3b2b2b;
}

.order-meta {
  margin-top: 2px;
  font-size: 13px;
  color: #6b5b4b;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.order-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.order-select input {
  transform: scale(1.1);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-pill[data-status='pending'] {
  background: #fef3c7;
  color: #92400e;
}

.status-pill[data-status='confirmed'] {
  background: #dcfce7;
  color: #166534;
}

.status-pill[data-status='preparing'] {
  background: #e0f2fe;
  color: #075985;
}

.status-pill[data-status='ready'] {
  background: #fef9c3;
  color: #854d0e;
}

.status-pill[data-status='delivered'] {
  background: #ecfdf5;
  color: #047857;
}

.status-pill[data-status='cancelled'] {
  background: #fee2e2;
  color: #b91c1c;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  border: 1px solid #ddd;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 60;
}

.modal-box {
  background: #ffffff;
  padding: 16px 16px 18px;
  border-radius: 16px;
  width: 540px;
  max-width: 92vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.modal-section {
  margin-top: 8px;
}

.modal-section h4 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.details {
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 13px;
}

.items-list {
  display: grid;
  gap: 8px;
  margin-top: 4px;
}

.item-row {
  border-top: 1px solid #e5e7eb;
  padding-top: 6px;
}

.item-name {
  font-weight: 600;
}

.item-meta {
  color: #6b7280;
  font-size: 13px;
}

.item-subtotal {
  font-weight: 600;
  font-size: 13px;
}

.modal-actions {
  margin-top: 12px;
  text-align: right;
}

@media (max-width: 768px) {
  .orders-filters {
    grid-template-columns: minmax(0, 1fr);
  }

   .orders-bulk {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .order-side {
    align-items: flex-start;
  }
}
</style>