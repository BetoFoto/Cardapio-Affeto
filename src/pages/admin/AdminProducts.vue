<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import type { BuffetProduct, PriceTier } from '../../types'

const products = ref<BuffetProduct[]>([])
const editing = ref<BuffetProduct | null>(null)
const editingTiers = ref<PriceTier[]>([])
const categories = ref<{ id: string; name: string }[]>([])

// Seleção múltipla
const selectedIds = ref<Set<string>>(new Set())
const allSelected = computed(() => products.value.length > 0 && selectedIds.value.size === products.value.length)

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(products.value.map(p => p.id))
  }
}

const toggleSelect = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const load = async () => {
  if (!supabase) return
  const { data } = await supabase
    .from('products')
    .select('*, price_tiers(*)')
    .order('name', { ascending: true })
  products.value = (data || []) as BuffetProduct[]
}

onMounted(load)

const loadCategories = async () => {
  if (!supabase) return
  const { data } = await supabase.from('categories').select('id,name').order('name', { ascending: true })
  categories.value = (data || []) as { id: string; name: string }[]
}
onMounted(loadCategories)

const save = async () => {
  if (!editing.value) return
  if (!supabase) return
  const p = editing.value
  
  if (p.image_url && p.image_url.startsWith('blob:')) {
    const res = await fetch(p.image_url)
    const blob = await res.blob()
    const fileName = `produtos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { data: up, error: upErr } = await supabase.storage
      .from('produtos')
      .upload(fileName, blob, { contentType: blob.type })
    if (!upErr && up?.path) {
      const { data } = supabase.storage.from('produtos').getPublicUrl(up.path)
      p.image_url = data.publicUrl
    }
  }
  
  if (!p.slug && p.name) {
    p.slug = slugify(p.name)
  }
  
  const { id, created_at, updated_at, price_tiers, ...payload } = p
  let productId = id
  
  if (id) {
    await supabase.from('products').update(payload).eq('id', id)
  } else {
    const { data: inserted } = await supabase.from('products').insert(payload).select('id').single()
    productId = inserted?.id
  }
  
  if (productId && (p.pricing_mode === 'tiers' || p.pricing_mode === 'both')) {
    await supabase.from('price_tiers').delete().eq('product_id', productId)
    if (editingTiers.value.length > 0) {
      const tiersToInsert = editingTiers.value.map((t, idx) => ({
        product_id: productId,
        label: t.label,
        max_guests: t.max_guests,
        price: t.price,
        display_order: idx
      }))
      await supabase.from('price_tiers').insert(tiersToInsert)
    }
  }
  
  editing.value = null
  editingTiers.value = []
  await load()
}

const deactivate = async (p: BuffetProduct) => {
  if (!supabase) return
  await supabase.from('products').update({ active: false }).eq('id', p.id)
  await load()
}

const handleFileChange = (e: Event) => {
  if (!editing.value) return
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  editing.value.image_url = URL.createObjectURL(file)
}

const startNewProduct = () => {
  editing.value = {
    id: '',
    name: '',
    description: '',
    category_id: categories.value[0]?.id || '',
    base_price: 0,
    has_size_options: false,
    pricing_mode: 'unit',
    active: true,
  } as BuffetProduct
  editingTiers.value = []
}

const startEdit = (p: BuffetProduct) => {
  editing.value = { ...p }
  editingTiers.value = p.price_tiers ? [...p.price_tiers] : []
}

const addTier = () => {
  editingTiers.value.push({
    id: crypto.randomUUID(),
    product_id: editing.value?.id || '',
    label: '',
    max_guests: 0,
    price: 0,
    display_order: editingTiers.value.length
  })
}

const removeTier = (index: number) => {
  editingTiers.value.splice(index, 1)
}

const cancelEdit = () => {
  editing.value = null
  editingTiers.value = []
}

// Delete
const showConfirmDelete = ref(false)
const deletingProduct = ref<BuffetProduct | null>(null)
const deleteHasOrders = ref(false)

const requestDelete = async (p: BuffetProduct) => {
  deletingProduct.value = p
  deleteHasOrders.value = false
  
  // Verificar se produto tem pedidos associados
  if (supabase) {
    const { count } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', p.id)
    deleteHasOrders.value = (count || 0) > 0
  }
  
  showConfirmDelete.value = true
}

const confirmDelete = async () => {
  if (!supabase || !deletingProduct.value || deleteHasOrders.value) return
  await supabase.from('products').delete().eq('id', deletingProduct.value.id)
  showConfirmDelete.value = false
  deletingProduct.value = null
  await load()
}

const cancelDelete = () => {
  showConfirmDelete.value = false
  deletingProduct.value = null
  deleteHasOrders.value = false
}

// Exclusão em lote
const showBulkDelete = ref(false)
const bulkDeleteBlocked = ref<string[]>([])

const requestBulkDelete = async () => {
  if (selectedIds.value.size === 0) return
  bulkDeleteBlocked.value = []
  
  // Verificar quais produtos têm pedidos
  if (supabase) {
    for (const id of selectedIds.value) {
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id)
      if ((count || 0) > 0) {
        const product = products.value.find(p => p.id === id)
        if (product) bulkDeleteBlocked.value.push(product.name)
      }
    }
  }
  
  showBulkDelete.value = true
}

const confirmBulkDelete = async () => {
  if (!supabase) return
  
  // Filtrar apenas os que podem ser deletados
  const idsToDelete = [...selectedIds.value].filter(id => {
    const product = products.value.find(p => p.id === id)
    return product && !bulkDeleteBlocked.value.includes(product.name)
  })
  
  if (idsToDelete.length > 0) {
    await supabase.from('products').delete().in('id', idsToDelete)
  }
  
  showBulkDelete.value = false
  selectedIds.value.clear()
  bulkDeleteBlocked.value = []
  await load()
}

const cancelBulkDelete = () => {
  showBulkDelete.value = false
  bulkDeleteBlocked.value = []
}
</script>

<template>
  <div class="products-root">
    <div class="products-shell">
      <header class="products-header">
        <div>
          <h2 class="title">Produtos</h2>
          <p class="subtitle">Gerencie os itens do cardápio exibidos para o cliente.</p>
        </div>
        <button class="primary-btn" type="button" @click="startNewProduct">
          <span class="primary-icon">＋</span>
          <span>Adicionar novo</span>
        </button>
      </header>

      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de produtos</h3>
          <p class="card-sub">{{ products.length }} itens cadastrados</p>
        </div>
        
        <!-- Barra de ações em lote -->
        <div v-if="selectedIds.size > 0" class="bulk-actions">
          <span>{{ selectedIds.size }} selecionado(s)</span>
          <button class="btn danger" type="button" @click="requestBulkDelete">Excluir selecionados</button>
          <button class="btn ghost" type="button" @click="selectedIds.clear()">Limpar seleção</button>
        </div>
        
        <div class="table-wrap" v-if="products.length">
          <table class="table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" title="Selecionar todos" />
                </th>
                <th>Nome</th>
                <th>Status</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id" :class="{ 'row-selected': selectedIds.has(p.id) }">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.has(p.id)" @change="toggleSelect(p.id)" />
                </td>
                <td class="col-name">
                  <div class="name">{{ p.name }}</div>
                  <div class="desc" v-if="p.description">{{ p.description }}</div>
                </td>
                <td>
                  <span class="status-pill" :class="p.active ? 'status-pill--active' : 'status-pill--inactive'">
                    {{ p.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="col-actions">
                  <button class="btn ghost" type="button" @click="startEdit(p)">Editar</button>
                  <button class="btn ghost" type="button" @click="deactivate(p)">Desativar</button>
                  <button class="btn ghost danger" type="button" @click="requestDelete(p)">Excluir</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty">Nenhum produto cadastrado ainda.</p>
      </section>

      <!-- Modal de edição -->
      <div v-if="editing" class="modal">
        <div class="box">
          <h3 class="box-title">{{ editing.id ? 'Editar' : 'Novo' }} Produto</h3>
          <div class="box-grid">
            <label>
              <span>Nome</span>
              <input v-model="editing.name" />
            </label>
            <label>
              <span>Descrição curta</span>
              <textarea v-model="editing.description" rows="2"></textarea>
            </label>
            <label>
              <span>Descrição longa</span>
              <textarea v-model="editing.long_description" rows="4" placeholder="Use quebras de linha para listas"></textarea>
            </label>
            <label>
              <span>Observações</span>
              <textarea v-model="editing.observations" rows="2" placeholder="Ex: Bebidas alcoólicas a consultar"></textarea>
            </label>
            <label>
              <span>Categoria</span>
              <select v-model="editing.category_id">
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
            <label>
              <span>Modo de preço</span>
              <select v-model="editing.pricing_mode">
                <option value="unit">Preço unitário</option>
                <option value="tiers">Faixas de convidados</option>
                <option value="both">Ambos</option>
              </select>
            </label>
            <label v-if="editing.pricing_mode === 'unit' || editing.pricing_mode === 'both'">
              <span>Preço base (unitário)</span>
              <input type="number" step="0.01" v-model.number="editing.base_price" />
            </label>
            <div v-if="editing.pricing_mode === 'tiers' || editing.pricing_mode === 'both'" class="tiers-section">
              <div class="tiers-header">
                <span class="tiers-label">Faixas de preço por convidados</span>
                <button type="button" class="btn add-tier" @click="addTier">+ Adicionar faixa</button>
              </div>
              <div v-for="(tier, idx) in editingTiers" :key="tier.id" class="tier-row">
                <input v-model="tier.label" placeholder="Ex: Até 50 Convidados" class="tier-label" />
                <input type="number" v-model.number="tier.max_guests" placeholder="Máx" class="tier-guests" />
                <input type="number" step="0.01" v-model.number="tier.price" placeholder="Preço" class="tier-price" />
                <button type="button" class="btn ghost tier-remove" @click="removeTier(idx)">✕</button>
              </div>
              <p v-if="editingTiers.length === 0" class="tiers-empty">Nenhuma faixa cadastrada.</p>
            </div>
            <label class="inline">
              <input type="checkbox" v-model="editing.has_size_options" /> Possui opções de tamanho (legado)
            </label>
            <div v-if="editing.has_size_options" class="sizes">
              <label>
                <span>Preço 5p</span>
                <input type="number" step="0.01" v-model.number="editing.size_5p_price" />
              </label>
              <label>
                <span>Preço 10p</span>
                <input type="number" step="0.01" v-model.number="editing.size_10p_price" />
              </label>
            </div>
            <label>
              <span>Imagem URL</span>
              <input v-model="editing.image_url" placeholder="URL pública (ou envie arquivo)" />
            </label>
            <label>
              <span>Enviar imagem</span>
              <input type="file" accept="image/*" @change="handleFileChange" />
            </label>
            <label>
              <span>Status</span>
              <select v-model="editing.active">
                <option :value="true">Ativo</option>
                <option :value="false">Inativo</option>
              </select>
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn" type="button" @click="cancelEdit">Cancelar</button>
            <button class="btn primary" type="button" @click="save">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal de confirmação de exclusão -->
      <div v-if="showConfirmDelete" class="modal">
        <div class="box">
          <h3 class="box-title">Excluir produto?</h3>
          <p v-if="deleteHasOrders" class="warn-text warn-error">
            ⚠️ Este produto não pode ser excluído porque está associado a pedidos existentes. 
            Você pode desativá-lo para que não apareça mais no cardápio.
          </p>
          <p v-else class="warn-text">Tem certeza que deseja excluir "{{ deletingProduct?.name }}"? Esta ação não pode ser desfeita.</p>
          <div class="modal-actions">
            <button class="btn" type="button" @click="cancelDelete">Cancelar</button>
            <button v-if="!deleteHasOrders" class="btn danger" type="button" @click="confirmDelete">Excluir</button>
            <button v-else class="btn" type="button" @click="deletingProduct && deactivate(deletingProduct); cancelDelete()">Desativar</button>
          </div>
        </div>
      </div>

      <!-- Modal de exclusão em lote -->
      <div v-if="showBulkDelete" class="modal">
        <div class="box">
          <h3 class="box-title">Excluir {{ selectedIds.size }} produto(s)?</h3>
          <div v-if="bulkDeleteBlocked.length > 0" class="warn-text warn-error">
            <p>⚠️ Os seguintes produtos não podem ser excluídos (têm pedidos associados):</p>
            <ul class="blocked-list">
              <li v-for="name in bulkDeleteBlocked" :key="name">{{ name }}</li>
            </ul>
          </div>
          <p class="warn-text">
            <span v-if="bulkDeleteBlocked.length > 0">
              {{ selectedIds.size - bulkDeleteBlocked.length }} produto(s) serão excluídos.
            </span>
            <span v-else>
              Tem certeza que deseja excluir {{ selectedIds.size }} produto(s)? Esta ação não pode ser desfeita.
            </span>
          </p>
          <div class="modal-actions">
            <button class="btn" type="button" @click="cancelBulkDelete">Cancelar</button>
            <button 
              class="btn danger" 
              type="button" 
              @click="confirmBulkDelete"
              :disabled="selectedIds.size === bulkDeleteBlocked.length"
            >
              Excluir {{ selectedIds.size - bulkDeleteBlocked.length }} produto(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-root {
  min-height: calc(100vh - 60px);
  background: #f4f2f0;
  display: flex;
  justify-content: center;
}
.products-shell {
  flex: 1;
  max-width: 1080px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.title { margin: 0; font-size: 22px; }
.subtitle { margin: 4px 0 0; font-size: 14px; color: #6b5a5a; }
.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #d1151e;
  color: #fff;
  border-radius: 999px;
  padding: 8px 14px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.primary-icon { font-size: 16px; }
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 16px 16px;
  border: 1px solid #e3d8d3;
}
.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.card-title { margin: 0; font-size: 16px; font-weight: 600; }
.card-sub { margin: 0; font-size: 12px; color: #7a6666; }
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th, .table td { padding: 8px 10px; text-align: left; }
.table thead { background: #f6f2ef; }
.table tbody tr:nth-child(even) { background: #faf7f5; }
.col-name { width: 100%; }
.name { font-weight: 600; }
.desc { font-size: 12px; color: #7a6666; }
.col-actions { white-space: nowrap; }
.status-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; }
.status-pill--active { background: #22c55e; color: #052e16; }
.status-pill--inactive { background: #e5e7eb; color: #111827; }
.btn { border-radius: 999px; border: 1px solid #d0c4bf; padding: 6px 10px; font-size: 12px; background: #ffffff; cursor: pointer; }
.btn.ghost { background: transparent; }
.btn.primary { background: #d1151e; border-color: #d1151e; color: #fff; }
.btn.danger { background: #dc2626; border-color: #dc2626; color: #fff; }
.btn.ghost.danger { background: transparent; border-color: #dc2626; color: #dc2626; }
.warn-text { font-size: 13px; color: #4b5563; margin: 0 0 12px; }
.warn-text.warn-error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 8px; }
.blocked-list { margin: 8px 0; padding-left: 20px; font-size: 12px; }
.bulk-actions { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
.col-check { width: 40px; text-align: center; }
.col-check input { cursor: pointer; width: 16px; height: 16px; }
.row-selected { background: #fef9c3 !important; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.empty { margin: 8px 0 0; font-size: 13px; color: #7a6666; }
.modal { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: grid; place-items: center; z-index: 100; }
.box { background: #ffffff; padding: 18px 18px 14px; border-radius: 14px; width: 580px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
.box-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.box-grid { display: flex; flex-direction: column; gap: 8px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
label.inline { flex-direction: row; align-items: center; gap: 8px; }
input, textarea, select { border: 1px solid #ccc; border-radius: 8px; padding: 8px; font-size: 13px; }
.sizes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tiers-section { border: 1px solid #e3d8d3; border-radius: 8px; padding: 12px; background: #faf7f5; }
.tiers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.tiers-label { font-weight: 600; font-size: 13px; }
.add-tier { font-size: 12px; padding: 4px 10px; }
.tier-row { display: grid; grid-template-columns: 1fr 80px 100px 32px; gap: 8px; margin-bottom: 8px; align-items: center; }
.tier-remove { padding: 4px 8px; font-size: 14px; color: #d1151e; }
.tiers-empty { font-size: 12px; color: #7a6666; margin: 0; text-align: center; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
@media (max-width: 900px) {
  .products-header { flex-direction: column; align-items: flex-start; }
  .col-actions { display: flex; flex-direction: column; gap: 4px; }
  .box { width: auto; max-width: calc(100% - 8px); margin: 0 4px; border-radius: 12px; }
}
</style>
