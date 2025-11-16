import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from './lib/supabase'
import Home from './pages/Home.vue'
import Category from './pages/Category.vue'
import Cart from './pages/Cart.vue'
import Checkout from './pages/Checkout.vue'
import HowToOrder from './pages/HowToOrder.vue'
import Terms from './pages/Terms.vue'

import AdminLogin from './pages/admin/AdminLogin.vue'
import AdminForgotPassword from './pages/admin/AdminForgotPassword.vue'
import AdminDashboard from './pages/admin/AdminDashboard.vue'
import AdminCategories from './pages/admin/AdminCategories.vue'
import AdminProducts from './pages/admin/AdminProducts.vue'
import AdminOrders from './pages/admin/AdminOrders.vue'
import AdminSettings from './pages/admin/AdminSettings.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/categoria/:slug', name: 'category', component: Category },
  { path: '/carrinho', name: 'cart', component: Cart },
  { path: '/checkout', name: 'checkout', component: Checkout },
  { path: '/como-encomendar', name: 'how-to-order', component: HowToOrder },
  { path: '/termos', name: 'terms', component: Terms },

  { path: '/admin', name: 'admin-login', component: AdminLogin },
  { path: '/admin/recuperar', name: 'admin-forgot', component: AdminForgotPassword },
  { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminDashboard },
  { path: '/admin/categorias', name: 'admin-categories', component: AdminCategories },
  { path: '/admin/produtos', name: 'admin-products', component: AdminProducts },
  { path: '/admin/pedidos', name: 'admin-orders', component: AdminOrders },
  { path: '/admin/config', name: 'admin-settings', component: AdminSettings },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  const isPublicAdminRoute = to.path === '/admin' || to.path === '/admin/recuperar'
  const isAdminRoute = to.path.startsWith('/admin') && !isPublicAdminRoute
  if (isAdminRoute) {
    const session = supabase ? (await supabase.auth.getSession()).data.session : null
    if (!session) return '/admin'
  }
})

export default router