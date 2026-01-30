<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { supabase } from '../../lib/supabase'

interface CategoryRow {
  id: string
  name: string
  slug: string
  image_url?: string | null
  active: boolean
  display_order?: number | null
  product_count?: number
}

const categories = ref<CategoryRow[]>([])
const loading = ref(true)
const editing = ref<CategoryRow | null>(null)
const showConfirmInactive = ref(false)
const pendingStatus = ref<'active' | 'inactive' | null>(null)

// Seleção múltipla
const selectedIds = ref<Set<string>>(new Set())
const allSelected = computed(() => categories.value.length > 0 && selectedIds.value.size === categories.value.length)

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(categories.value.map(c => c.id))
  }
}

const toggleSelect = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const load = async () => {
  if (!supabase) {
    loading.value = false
    return
  }
  const { data, error } = await supabase
    .from('categories')
    .select('id,name,slug,image_url,active,display_order, products:products(count)')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (!error && data) {
    categories.value = (data as any[]).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image_url: c.image_url,
      active: c.active,
      display_order: c.display_order,
      product_count: c.products?.[0]?.count ?? 0,
    }))
  }
  loading.value = false
}

onMounted(load)

const startCreate = () => {
  editing.value = {
    id: '',
    name: '',
    slug: '',
    image_url: null,
    active: true,
    display_order: null,
    product_count: 0,
  }
}

const startEdit = (row: CategoryRow) => {
  editing.value = { ...row }
}

const handleFileChange = (e: Event) => {
  if (!editing.value) return
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  editing.value.image_url = URL.createObjectURL(file)
}

const save = async () => {
  if (!supabase || !editing.value) return

  if (editing.value.image_url && editing.value.image_url.startsWith('blob:')) {
    const res = await fetch(editing.value.image_url)
    const blob = await res.blob()
    const fileName = `categorias/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { data: up, error: upErr } = await supabase.storage
      .from('categorias')
      .upload(fileName, blob, { contentType: blob.type })
    if (!upErr && up?.path) {
      const { data } = supabase.storage.from('categorias').getPublicUrl(up.path)
      editing.value.image_url = data.publicUrl
    }
  }

  const payload: any = {
    name: editing.value.name,
    slug: editing.value.slug,
    image_url: editing.value.image_url,
    active: editing.value.active,
    display_order: editing.value.display_order,
  }
  if (editing.value.id) {
    await supabase.from('categories').update(payload).eq('id', editing.value.id)
  } else {
    await supabase.from('categories').insert(payload)
  }
  editing.value = null
  await load()
}

const requestToggleActive = (row: CategoryRow) => {
  pendingStatus.value = row.active ? 'inactive' : 'active'
  editing.value = { ...row }
  if (pendingStatus.value === 'inactive' && (row.product_count || 0) > 0) {
    showConfirmInactive.value = true
  } else {
    applyToggleActive()
  }
}

const applyToggleActive = async () => {
  if (!supabase || !editing.value || !pendingStatus.value) return
  await supabase.from('categories').update({ active: pendingStatus.value === 'active' }).eq('id', editing.value.id)
  pendingStatus.value = null
  showConfirmInactive.value = false
  editing.value = null
  await load()
}

const cancelConfirmInactive = () => {
  showConfirmInactive.value = false
  pendingStatus.value = null
  editing.value = null
}

// Delete individual
const showConfirmDelete = ref(false)
const deletingCategory = ref<CategoryRow | null>(null)

const requestDelete = (row: CategoryRow) => {
  deletingCategory.value = row
  showConfirmDelete.value = true
}

const confirmDelete = async () => {
  if (!supabase || !deletingCategory.value) return
  if ((deletingCategory.value.product_count || 0) > 0) return
  await supabase.from('categories').delete().eq('id', deletingCategory.value.id)
  showConfirmDelete.value = false
  deletingCategory.value = null
  await load()
}

const cancelDelete = () => {
  showConfirmDelete.value = false
  deletingCategory.value = null
}

// Exclusão em lote
const showBulkDelete = ref(false)
const bulkDeleteBlocked = ref<string[]>([])

const requestBulkDelete = () => {
  if (selectedIds.value.size === 0) return
  bulkDeleteBlocked.value = []
  
  // Verificar quais categorias têm produtos
  for (const id of selectedIds.value) {
    const cat = categories.value.find(c => c.id === id)
    if (cat && (cat.product_count || 0) > 0) {
      bulkDeleteBlocked.value.push(cat.name)
    }
  }
  
  showBulkDelete.value = true
}

const confirmBulkDelete = async () => {
  if (!supabase) return
  
  // Filtrar apenas os que podem ser deletados (sem produtos)
  const idsToDelete = [...selectedIds.value].filter(id => {
    const cat = categories.value.find(c => c.id === id)
    return cat && (cat.product_count || 0) === 0
  })
  
  if (idsToDelete.length > 0) {
    await supabase.from('categories').delete().in('id', idsToDelete)
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
  <div class="categories-root">
    <div class="categories-shell">
      <header class="page-header">
        <div>
          <h2 class="title">Categorias do Cardápio</h2>
          <p class="subtitle">Gerencie as seções do cardápio que aparecem para o cliente.</p>
        </div>
        <div class="header-actions">
          <router-link class="btn ghost" to="/admin/produtos">Ir para Produtos</router-link>
          <button class="btn primary" type="button" @click="startCreate">Nova categoria</button>
        </div>
      </header>

      <section class="card">
        <header class="card-header">
          <h3 class="card-title">Lista de categorias</h3>
          <p class="card-sub">{{ categories.length }} cadastradas</p>
        </header>

        <!-- Barra de ações em lote -->
        <div v-if="selectedIds.size > 0" class="bulk-actions">
          <span>{{ selectedIds.size }} selecionada(s)</span>
          <button class="btn danger" type="button" @click="requestBulkDelete">Excluir selecionadas</button>
          <button class="btn ghost" type="button" @click="selectedIds.clear()">Limpar seleção</button>
        </div>

        <div v-if="loading" class="state">Carregando categorias...</div>
        <div v-else-if="!categories.length" class="state">Nenhuma categoria cadastrada.</div>
        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" title="Selecionar todas" />
                </th>
                <th>Categoria</th>
                <th>Slug</th>
                <th>Produtos</th>
                <th>Status</th>
                <th>Ordem</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in categories" :key="c.id" :class="{ 'row-selected': selectedIds.has(c.id) }">
                <td class="col-check">
                  <input type="checkbox" :checked="selectedIds.has(c.id)" @change="toggleSelect(c.id)" />
                </td>
                <td>
                  <div class="cat-cell">
                    <div v-if="c.image_url" class="cat-thumb" :style="{ backgroundImage: `url(${c.image_url})` }"></div>
                    <div class="cat-text">
                      <div class="name">{{ c.name }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ c.slug }}</td>
                <td>{{ c.product_count }}</td>
                <td>
                  <span class="status-pill" :class="c.active ? 'status-pill--active' : 'status-pill--inactive'">
                    {{ c.active ? 'Ativa' : 'Inativa' }}
                  </span>
                </td>
                <td>{{ c.display_order ?? '-' }}</td>
                <td class="col-actions">
                  <button class="btn ghost" type="button" @click="startEdit(c)">Editar</button>
                  <button class="btn ghost" type="button" @click="requestToggleActive(c)">
                    {{ c.active ? 'Desativar' : 'Ativar' }}
                  </button>
                  <button class="btn ghost danger" type="button" @click="requestDelete(c)">Excluir</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Modal de edição -->
      <div v-if="editing && !showConfirmInactive" class="modal">
        <div class="modal-box">
          <h3 class="modal-title">{{ editing.id ? 'Editar categoria' : 'Nova categoria' }}</h3>
          <div class="modal-grid">
            <label>
              <span>Nome</span>
              <input v-model="editing.name" />
            </label>
            <label>
              <span>Slug</span>
              <input v-model="editing.slug" placeholder="pratos-principais" />
            </label>
            <label>
              <span>Ordem (opcional)</span>
              <input type="number" v-model.number="editing.display_order" />
            </label>
            <label>
              <span>Imagem da categoria</span>
              <input type="file" accept="image/*" @change="handleFileChange" />
            </label>
            <label class="inline">
              <input type="checkbox" v-model="editing.active" /> Categoria ativa
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn" type="button" @click="editing = null">Cancelar</button>
            <button class="btn primary" type="button" @click="save">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal de desativação -->
      <div v-if="showConfirmInactive" class="modal">
        <div class="modal-box">
          <h3 class="modal-title">Desativar categoria?</h3>
          <p class="warn-text">
            Esta categoria está associada a {{ editing?.product_count || 0 }} produto(s). Eles continuarão
            existindo, mas não aparecerão no cardápio público enquanto a categoria estiver inativa.
          </p>
          <div class="modal-actions">
            <button class="btn" type="button" @click="cancelConfirmInactive">Cancelar</button>
            <button class="btn primary" type="button" @click="applyToggleActive">Confirmar desativação</button>
          </div>
        </div>
      </div>

      <!-- Modal de exclusão individual -->
      <div v-if="showConfirmDelete" class="modal">
        <div class="modal-box">
          <h3 class="modal-title">Excluir categoria?</h3>
          <p v-if="(deletingCategory?.product_count || 0) > 0" class="warn-text warn-error">
            ⚠️ Esta categoria possui {{ deletingCategory?.product_count }} produto(s) associado(s). 
            Você precisa mover ou excluir os produtos antes de excluir a categoria.
          </p>
          <p v-else class="warn-text">
            Tem certeza que deseja excluir "{{ deletingCategory?.name }}"? Esta ação não pode ser desfeita.
          </p>
          <div class="modal-actions">
            <button class="btn" type="button" @click="cancelDelete">Cancelar</button>
            <button class="btn danger" type="button" @click="confirmDelete" :disabled="(deletingCategory?.product_count || 0) > 0">
              Excluir
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de exclusão em lote -->
      <div v-if="showBulkDelete" class="modal">
        <div class="modal-box">
          <h3 class="modal-title">Excluir {{ selectedIds.size }} categoria(s)?</h3>
          <div v-if="bulkDeleteBlocked.length > 0" class="warn-text warn-error">
            <p>⚠️ As seguintes categorias não podem ser excluídas (têm produtos associados):</p>
            <ul class="blocked-list">
              <li v-for="name in bulkDeleteBlocked" :key="name">{{ name }}</li>
            </ul>
          </div>
          <p class="warn-text">
            <span v-if="bulkDeleteBlocked.length > 0">
              {{ selectedIds.size - bulkDeleteBlocked.length }} categoria(s) serão excluídas.
            </span>
            <span v-else>
              Tem certeza que deseja excluir {{ selectedIds.size }} categoria(s)? Esta ação não pode ser desfeita.
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
              Excluir {{ selectedIds.size - bulkDeleteBlocked.length }} categoria(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-root {
  min-height: calc(100vh - 60px);
  background: #f4f2f0;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
}
.categories-shell {
  flex: 1;
  max-width: 1080px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.title { margin: 0; font-size: 22px; }
.subtitle { margin: 4px 0 0; font-size: 14px; color: #6b5a5a; }
.header-actions { display: flex; gap: 8px; }
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
.state { font-size: 14px; color: #7a6666; }
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th, .table td { padding: 8px 10px; text-align: left; }
.table thead { background: #f6f2ef; }
.col-check { width: 40px; text-align: center; }
.col-check input { cursor: pointer; width: 16px; height: 16px; }
.row-selected { background: #fef9c3 !important; }
.col-actions { white-space: nowrap; }
.cat-cell { display: flex; align-items: center; gap: 8px; }
.cat-thumb {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
}
.status-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; }
.status-pill--active { background: #22c55e; color: #052e16; }
.status-pill--inactive { background: #e5e7eb; color: #111827; }
.btn {
  border-radius: 999px;
  border: 1px solid #d0c4bf;
  padding: 6px 10px;
  font-size: 12px;
  background: #ffffff;
  cursor: pointer;
}
.btn.primary { background: #d1151e; border-color: #d1151e; color: #fff; }
.btn.ghost { background: #f3f4f6; }
.btn.danger { background: #dc2626; border-color: #dc2626; color: #fff; }
.btn.ghost.danger { background: transparent; border-color: #dc2626; color: #dc2626; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  z-index: 100;
}
.modal-box {
  background: #ffffff;
  width: 520px;
  max-width: 90%;
  border-radius: 14px;
  padding: 18px 18px 14px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title { margin: 0 0 10px; font-size: 16px; font-weight: 600; }
.modal-grid { display: flex; flex-direction: column; gap: 8px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
label.inline { flex-direction: row; align-items: center; gap: 8px; }
input { border: 1px solid #ccc; border-radius: 8px; padding: 8px; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.warn-text { font-size: 13px; color: #4b5563; margin: 0 0 12px; }
.warn-text.warn-error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 8px; }
.blocked-list { margin: 8px 0; padding-left: 20px; font-size: 12px; }
@media (max-width: 900px) {
  .categories-root { justify-content: stretch; }
  .categories-shell { padding: 16px 10px; max-width: none; width: 100%; }
  .card { border-radius: 0; margin-inline: -10px; padding: 12px 12px 14px; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .card-header { flex-direction: column; align-items: flex-start; }
  .table { min-width: 640px; font-size: 12px; }
  .modal-box { width: auto; max-width: calc(100% - 8px); border-radius: 10px; padding: 16px 14px 14px; margin: 0 4px; }
}
</style>
