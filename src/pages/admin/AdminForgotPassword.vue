<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')
const router = useRouter()

const submit = async () => {
  if (!supabase) {
    errorMsg.value = 'Conexão com o servidor não configurada.'
    return
  }
  errorMsg.value = ''
  success.value = false
  loading.value = true
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: window.location.origin + '/admin',
  })
  loading.value = false
  if (!error) {
    success.value = true
  } else {
    errorMsg.value = 'Não foi possível enviar o e-mail. Verifique o endereço informado.'
  }
}

const goBack = () => router.push('/admin')
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <h1>Redefinir senha</h1>
        <p>Informe o e-mail da sua conta administrativa para receber um link de redefinição.</p>
      </div>
      <form class="form" @submit.prevent="submit">
        <label>
          <span>E-mail</span>
          <input v-model="email" type="email" required placeholder="voce@exemplo.com" />
        </label>
        <div class="actions">
          <button class="btn" type="button" @click="goBack">Voltar</button>
          <button class="btn primary" type="submit" :disabled="loading">
            <span v-if="!loading">Enviar link</span>
            <span v-else>Enviando...</span>
          </button>
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="success" class="success">Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.</p>
      </form>
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
.primary { background: #b31919; color: #fff; border-color: #b31919 }
.primary[disabled] { opacity: .7; cursor: default }
.error { margin: 4px 0 0; color: #b31919; font-size: 13px }
.success { margin: 4px 0 0; color: #1b873f; font-size: 13px }
@media (max-width: 600px) {
  .card { padding: 20px 16px 16px }
}
</style>
