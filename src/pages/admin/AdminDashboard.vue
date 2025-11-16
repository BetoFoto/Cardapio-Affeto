<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'

type OrderRow = {
  id: string
  customer_name: string
  total: number
  status: string
  created_at?: string
}

const router = useRouter()

const totalOrders = ref(0)
const totalRevenue = ref(0)
const pendingCount = ref(0)
const completedCount = ref(0)
const recentOrders = ref<OrderRow[]>([])
const loading = ref(true)

const loadSummary = async () => {
  if (!supabase) {
    loading.value = false
    return
  }
  const { data, error } = await supabase
    .from('orders')
    .select('id,total,status,created_at,customer_name')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!error && data) {
    const rows = data as any[]
    totalOrders.value = rows.length
    totalRevenue.value = rows.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    pendingCount.value = rows.filter((o) => o.status === 'pending').length
    completedCount.value = rows.filter((o) => ['delivered', 'ready', 'confirmed'].includes(o.status)).length
    recentOrders.value = rows as OrderRow[]
  }
  loading.value = false
}

onMounted(loadSummary)

const goProducts = () => router.push('/admin/categorias')

const goOrders = () => router.push('/admin/pedidos')
const goSettings = () => router.push('/admin/config')
</script>

<template>
  <div class="dashboard-root">
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="brand-row">
            <div
              class="brand-avatar"
              style="background-image: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=200&q=80');"
            ></div>
            <div class="brand-text">
              <span class="brand-title">Affetto</span>
              <span class="brand-sub">Painel Admin</span>
            </div>
          </div>
          <nav class="nav">
            <button class="nav-item nav-item--active" type="button">
              <span class="nav-icon">📊</span>
              <span>Dashboard</span>
            </button>
            <button class="nav-item" type="button" @click="goOrders">
              <span class="nav-icon">🧾</span>
              <span>Pedidos</span>
            </button>
            <button class="nav-item" type="button" @click="goProducts">
              <span class="nav-icon">🍽️</span>
              <span>Cardápio</span>
            </button>
            <button class="nav-item" type="button" @click="goSettings">
              <span class="nav-icon">⚙️</span>
              <span>Configurações</span>
            </button>
          </nav>
        </div>
        <div class="sidebar-bottom">
          <button class="nav-item" type="button">
            <span class="nav-icon">⏏️</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main class="main">
        <header class="header">
          <div>
            <h1 class="page-title">Painel Administrativo</h1>
            <p class="page-sub">Olá, Affetto! Bem-vindo(a) de volta.</p>
          </div>
          <button class="primary-btn" type="button" @click="goProducts">
            <span class="primary-btn-icon">＋</span>
            <span>Adicionar Item ao Cardápio</span>
          </button>
        </header>

        <section class="stats-grid">
          <article class="stat-card">
            <p class="stat-label">Vendas Totais</p>
            <p class="stat-value">R$ {{ totalRevenue.toFixed(2) }}</p>
            <p class="stat-trend">+0.0% vs. mês passado</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Pedidos Pendentes</p>
            <p class="stat-value">{{ pendingCount }}</p>
            <p class="stat-trend">+0.0% vs. semana passada</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Pedidos Concluídos</p>
            <p class="stat-value">{{ completedCount }}</p>
            <p class="stat-trend">+0.0% vs. mês passado</p>
          </article>
          <article class="stat-card">
            <p class="stat-label">Total de Pedidos (últimos 10)</p>
            <p class="stat-value">{{ totalOrders }}</p>
            <p class="stat-trend">+0.0% vs. mês passado</p>
          </article>
        </section>

        <section class="content-grid">
          <div class="content-main">
            <section class="panel">
              <div class="panel-header">
                <div>
                  <p class="panel-title">Desempenho de Vendas</p>
                  <p class="panel-sub">Últimos 7 dias (mock)</p>
                </div>
                <p class="panel-trend">+0.0%</p>
              </div>
              <div class="chart">
                <div class="chart-row">
                  <div class="chart-bar" style="height: 70%"></div>
                  <div class="chart-bar" style="height: 50%"></div>
                  <div class="chart-bar" style="height: 20%"></div>
                  <div class="chart-bar" style="height: 40%"></div>
                  <div class="chart-bar" style="height: 80%"></div>
                  <div class="chart-bar" style="height: 100%"></div>
                  <div class="chart-bar" style="height: 60%"></div>
                </div>
                <div class="chart-labels">
                  <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="panel-header panel-header--table">
                <p class="panel-title">Pedidos Recentes</p>
                <button class="link-btn" type="button" @click="goOrders">Ver todos</button>
              </div>
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading">
                      <td colspan="4" class="table-empty">Carregando...</td>
                    </tr>
                    <tr v-else-if="!recentOrders.length">
                      <td colspan="4" class="table-empty">Nenhum pedido recente.</td>
                    </tr>
                    <tr v-else v-for="o in recentOrders" :key="o.id">
                      <td class="table-id">#{{ o.id }}</td>
                      <td>{{ o.customer_name }}</td>
                      <td>R$ {{ Number(o.total).toFixed(2) }}</td>
                      <td>
                        <span
                          class="status-pill"
                          :class="{
                            'status-pill--pending': o.status === 'pending',
                            'status-pill--done': ['delivered', 'ready', 'confirmed'].includes(o.status),
                            'status-pill--cancelled': o.status === 'cancelled',
                          }"
                        >
                          {{ o.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside class="content-side">
            <section class="panel">
              <p class="panel-title">Itens Mais Vendidos</p>
              <ul class="best-list">
                <li class="best-item">
                  <div
                    class="best-thumb"
                    style="background-image: url('https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=200&q=80');"
                  ></div>
                  <div class="best-text">
                    <p class="best-name">Peru Assado com Ervas</p>
                    <p class="best-meta">35 vendidos (mock)</p>
                  </div>
                </li>
                <li class="best-item">
                  <div
                    class="best-thumb"
                    style="background-image: url('https://images.unsplash.com/photo-1485921325833-74b9ce41c814?auto=format&fit=crop&w=200&q=80');"
                  ></div>
                  <div class="best-text">
                    <p class="best-name">Bacalhoada à Gomes de Sá</p>
                    <p class="best-meta">28 vendidos (mock)</p>
                  </div>
                </li>
                <li class="best-item">
                  <div
                    class="best-thumb"
                    style="background-image: url('https://images.unsplash.com/photo-1604908176997-1251884b08a9?auto=format&fit=crop&w=200&q=80');"
                  ></div>
                  <div class="best-text">
                    <p class="best-name">Salada de Maionese Festiva</p>
                    <p class="best-meta">22 vendidos (mock)</p>
                  </div>
                </li>
                <li class="best-item">
                  <div
                    class="best-thumb"
                    style="background-image: url('https://images.unsplash.com/photo-1542089363-5427f1bf41c5?auto=format&fit=crop&w=200&q=80');"
                  ></div>
                  <div class="best-text">
                    <p class="best-name">Rabanada Tradicional</p>
                    <p class="best-meta">19 vendidos (mock)</p>
                  </div>
                </li>
              </ul>
            </section>
          </aside>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-root {
  min-height: calc(100vh - 60px);
  background: #f4f2f0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.dashboard-shell {
  display: flex;
  flex: 1;
  max-width: 1200px;
  padding: 24px 16px;
  gap: 16px;
}

.sidebar {
  width: 220px;
  background: #2b1818;
  color: #fdf3f3;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-weight: 700;
}

.brand-sub {
  font-size: 12px;
  color: #f0d0d0;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 13px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.nav-item--active {
  background: #b31919;
}

.nav-icon {
  font-size: 16px;
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.main {
  flex: 1;
  background: #e1e6ec;
  color: #201010;
  border-radius: 18px;
  padding: 20px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.page-sub {
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
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn-icon {
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid #e3d8d3;
}

.stat-label {
  font-size: 13px;
  color: #7a6666;
}

.stat-value {
  margin: 4px 0;
  font-size: 20px;
  font-weight: 700;
}

.stat-trend {
  font-size: 11px;
  color: #6fe6a5;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 14px;
  align-items: flex-start;
}

.content-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.content-side {
  display: flex;
}

.panel {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e3d8d3;
  padding: 14px 14px 12px;
}

.panel-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.panel-sub {
  margin: 0;
  font-size: 12px;
  color: #7a6666;
}

.panel-trend {
  margin: 0;
  font-size: 12px;
  color: #6fe6a5;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-header--table {
  margin-bottom: 0;
}

.chart {
  margin-top: 8px;
}

.chart-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 180px;
}

.chart-bar {
  flex: 1;
  background: rgba(209, 21, 30, 0.2);
  border-radius: 6px 6px 0 0;
  position: relative;
}

.chart-bar::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 100%;
  background: #d1151e;
  border-radius: 6px 6px 0 0;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #7a6666;
}

.table-wrap {
  margin-top: 10px;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.table thead {
  background: rgba(255, 255, 255, 0.04);
}

.table th,
.table td {
  padding: 8px 10px;
  text-align: left;
}

.table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.table-id {
  font-weight: 600;
}

.table-empty {
  text-align: center;
  color: #7a6666;
}

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.status-pill--pending {
  background: #facc15;
  color: #422006;
}

.status-pill--done {
  background: #22c55e;
  color: #052e16;
}

.status-pill--cancelled {
  background: #e5e7eb;
  color: #111827;
}

.link-btn {
  background: none;
  border: none;
  color: #f87171;
  font-size: 12px;
  cursor: pointer;
}

.best-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.best-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.best-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
}

.best-text {
  display: flex;
  flex-direction: column;
}

.best-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.best-meta {
  margin: 0;
  font-size: 11px;
  color: #7a6666;
}

@media (max-width: 960px) {
  .sidebar {
    display: none;
  }

  .dashboard-shell {
    max-width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>