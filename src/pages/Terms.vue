<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'

const termsText = ref<string | null>(null)

const loadSettings = async () => {
  if (!supabase) return
  const { data, error } = await supabase.from('settings').select('key,value')
  if (error || !data) return
  const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
  termsText.value = map.terms_text || null
}

onMounted(loadSettings)
</script>

<template>
  <main class="page-root">
    <div class="page-card">
      <header class="page-header">
        <h1>Termos de serviço</h1>
        <p>Leia com atenção as condições de venda e políticas da Affetto.</p>
      </header>
      <section class="page-content">
        <p v-if="termsText" class="text-block">{{ termsText }}</p>
        <p v-else class="text-block">
          Em breve você poderá consultar aqui os termos completos de serviço, incluindo prazos,
          condições de pagamento e políticas de cancelamento.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.page-root {
  min-height: calc(100vh - 80px);
  background: #f4f2f0;
  padding: 24px 16px 40px;
}

.page-card {
  max-width: 880px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 20px;
  padding: 20px 18px 24px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid #e5d4c8;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #8c1c1c;
}

.page-header p {
  margin: 0 0 16px;
  font-size: 14px;
  color: #6b5b4b;
}

.text-block {
  white-space: pre-line;
  font-size: 14px;
  color: #4b4b4b;
}
</style>
