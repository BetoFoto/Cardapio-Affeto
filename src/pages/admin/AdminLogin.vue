<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const router = useRouter()

const login = async () => {
  if (!supabase) {
    errorMsg.value = 'Conexão com o servidor não configurada.'
    return
  }
  errorMsg.value = ''
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
  loading.value = false
  if (!error) router.push('/admin/dashboard')
  else errorMsg.value = 'Falha na autenticação. Verifique seus dados.'
}

const goToForgot = () => router.push('/admin/recuperar')
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <h1>Área Administrativa</h1>
        <p>Entre com sua conta para gerenciar o cardápio e os pedidos.</p>
      </div>
      <form class="form" @submit.prevent="login">
        <label>
          <span>E-mail</span>
          <input v-model="email" type="email" required placeholder="voce@exemplo.com" />
        </label>
        <label>
          <span>Senha</span>
          <input v-model="password" type="password" required placeholder="••••••••" />
        </label>
        <div class="actions">
          <button class="btn primary" type="submit" :disabled="loading">
            <span v-if="!loading">Entrar</span>
            <span v-else>Entrando...</span>
          </button>
          <button class="link" type="button" @click="goToForgot">Esqueci minha senha</button>
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </form>
      <div class="footer">
        <span>Esqueceu sua senha?</span>
        <button class="link" type="button" @click="goToForgot">Redefinir acesso</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: calc(100vh - 60px); display: flex; align-items: center; justify-content: center; padding: 24px }
.card { width: 100%; max-width: 420px; background: #ffffff; border-radius: 16px; padding: 24px 24px 20px; box-shadow: 0 10px 25px rgba(0,0,0,.08); border: 1px solid #f0e2c5 }
.header { margin-bottom: 16px }
.header h1 { margin: 0 0 4px; font-size: 22px }
.header p { margin: 0; color: #666; font-size: 14px }
.form { display: grid; gap: 12px; margin-top: 8px }
label { display: grid; gap: 4px; font-size: 14px }
input { border: 1px solid #d3c4a4; border-radius: 10px; padding: 10px 12px; font-size: 14px }
input:focus { outline: none; border-color: #b31919; box-shadow: 0 0 0 1px rgba(179,25,25,.16) }
.actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px }
.btn { border: 1px solid transparent; background: #fff; padding: 10px 14px; border-radius: 999px; font-weight: 600; cursor: pointer; font-size: 14px }
.primary { background: #b31919; color: #fff; border-color: #b31919; flex: 1 }
.primary[disabled] { opacity: .7; cursor: default }
.link { background: transparent; border: none; color: #b31919; font-size: 13px; padding: 0 4px; cursor: pointer }
.link:hover { text-decoration: underline }
.error { margin: 4px 0 0; color: #b31919; font-size: 13px }
.footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #f0e2c5; display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px }
@media (max-width: 600px) {
  .card { padding: 20px 16px 16px }
}
</style>