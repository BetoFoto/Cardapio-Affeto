<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types'

const products = ref<Product[]>([])
const editing = ref<Product | null>(null)
const categories = ref<{ id: string; name: string }[]>([])

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const load = async () => {
  if (!supabase) return
  const { data } = await supabase.from('products').select('*').order('name', { ascending: true })
  products.value = (data || []) as Product[]
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
  const { id, created_at, updated_at, ...payload } = p
  if (id) await supabase.from('products').update(payload).eq('id', id)
  else await supabase.from('products').insert(payload)
  editing.value = null
  await load()
}

const deactivate = async (p: Product) => {
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
    active: true,
  } as Product
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
        <button
          class="primary-btn"
          type="button"
          @click="startNewProduct"
        >
          <span class="primary-icon">＋</span>
          <span>Adicionar novo</span>
        </button>
      </header>

      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Lista de produtos</h3>
          <p class="card-sub">{{ products.length }} itens cadastrados</p>
        </div>
        <div class="table-wrap" v-if="products.length">
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id">
                <td class="col-name">
                  <div class="name">{{ p.name }}</div>
                  <div class="desc" v-if="p.description">{{ p.description }}</div>
                </td>
                <td>
                  <span
                    class="status-pill"
                    :class="p.active ? 'status-pill--active' : 'status-pill--inactive'"
                  >
                    {{ p.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="col-actions">
                  <button class="btn ghost" type="button" @click="editing = { ...p }">Editar</button>
                  <button class="btn ghost" type="button" @click="deactivate(p)">Desativar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty">Nenhum produto cadastrado ainda.</p>
      </section>

    <div v-if="editing" class="modal">
      <div class="box">
        <h3 class="box-title">{{ editing.id ? 'Editar' : 'Novo' }} Produto</h3>
        <div class="box-grid">
          <label>
            <span>Nome</span>
            <input v-model="editing.name" />
          </label>
          <label>
            <span>Descrição</span>
            <textarea v-model="editing.description" rows="3"></textarea>
          </label>
          <label>
            <span>Categoria</span>
            <select v-model="editing.category_id">
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="inline">
            <input type="checkbox" v-model="editing.has_size_options" /> Possui opções de tamanho
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
          <label v-else>
            <span>Preço base</span>
            <input type="number" step="0.01" v-model.number="editing.base_price" />
          </label>
          <label>
            <span>Imagem URL</span>
            <input v-model="editing.image_url" placeholder="URL pública (ou envie arquivo)" />
          </label>
          <label>
            <span>Enviar imagem</span>
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
            />
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
          <button class="btn" type="button" @click="editing = null">Cancelar</button>
          <button class="btn primary" type="button" @click="save">Salvar</button>
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

.title {
  margin: 0;
  font-size: 22px;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6b5a5a;
}

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

.primary-icon {
  font-size: 16px;
}

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

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-sub {
  margin: 0;
  font-size: 12px;
  color: #7a6666;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table th,
.table td {
  padding: 8px 10px;
  text-align: left;
}

.table thead {
  background: #f6f2ef;
}

.table tbody tr:nth-child(even) {
  background: #faf7f5;
}

.col-name {
  width: 100%;
}

.name {
  font-weight: 600;
}

.desc {
  font-size: 12px;
  color: #7a6666;
}

.col-actions {
  white-space: nowrap;
}

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.status-pill--active {
  background: #22c55e;
  color: #052e16;
}

.status-pill--inactive {
  background: #e5e7eb;
  color: #111827;
}

.btn {
  border-radius: 999px;
  border: 1px solid #d0c4bf;
  padding: 6px 10px;
  font-size: 12px;
  background: #ffffff;
  cursor: pointer;
}

.btn.ghost {
  background: transparent;
}

.btn.primary {
  background: #d1151e;
  border-color: #d1151e;
  color: #fff;
}

.empty {
  margin: 8px 0 0;
  font-size: 13px;
  color: #7a6666;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
}

.box {
  background: #ffffff;
  padding: 18px 18px 14px;
  border-radius: 14px;
  width: 580px;
  max-width: 90%;
}

.box-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.box-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

label.inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

input,
textarea,
select {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
}

.sizes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .products-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .col-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .box {
    width: auto;
    max-width: calc(100% - 8px); /* ~4px de respiro em cada lado */
    max-height: calc(100vh - 40px);
    margin: 0 4px;
    border-radius: 12px;
    overflow-y: auto;
  }
}
</style>