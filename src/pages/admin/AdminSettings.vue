<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'

type SettingsForm = {
  whatsapp_number: string
  business_hours?: string
  welcome_message?: string
  contact_info?: string
  whatsapp_template?: string
  home_banner_title?: string
  home_banner_image_url?: string
  logo_url?: string
  brand_name?: string
  topbar_message?: string
  how_to_order_text?: string
  terms_text?: string
}

const settings = ref<SettingsForm>({ whatsapp_number: '' })

const bannerFile = ref<File | null>(null)
const logoFile = ref<File | null>(null)

const KEYS: (keyof SettingsForm)[] = [
  'whatsapp_number',
  'business_hours',
  'welcome_message',
  'contact_info',
  'whatsapp_template',
  'home_banner_title',
  'home_banner_image_url',
  'logo_url',
  'brand_name',
  'topbar_message',
  'how_to_order_text',
  'terms_text',
]

const load = async () => {
  if (!supabase) return
  const { data, error } = await supabase.from('settings').select('key,value')
  if (!error && data) {
    const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
    settings.value = {
      whatsapp_number: map.whatsapp_number || '',
      business_hours: map.business_hours || '',
      welcome_message: map.welcome_message || '',
      contact_info: map.contact_info || '',
      whatsapp_template: map.whatsapp_template || '',
      home_banner_title: map.home_banner_title || '',
      home_banner_image_url: map.home_banner_image_url || '',
      logo_url: map.logo_url || '',
      brand_name: map.brand_name || '',
      topbar_message: map.topbar_message || '',
      how_to_order_text: map.how_to_order_text || '',
      terms_text: map.terms_text || '',
    }
  }
}
onMounted(load)

const onBannerSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  bannerFile.value = file
}

const onLogoSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  logoFile.value = file
}

const uploadToBucket = async (file: File, folder: string) => {
  if (!supabase) throw new Error('Supabase client não configurado')
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage.from('config').upload(filePath, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('config').getPublicUrl(filePath)
  return data.publicUrl
}

const save = async () => {
  if (!supabase) {
    alert('Supabase não configurado. Verifique as variáveis de ambiente.')
    return
  }
  try {
    if (bannerFile.value) {
      const url = await uploadToBucket(bannerFile.value, 'banner')
      settings.value.home_banner_image_url = url
    }

    if (logoFile.value) {
      const url = await uploadToBucket(logoFile.value, 'logo')
      settings.value.logo_url = url
    }

    const rows = KEYS
      .filter((k) => settings.value[k] !== undefined)
      .map((k) => ({ key: k, value: String(settings.value[k] ?? '') }))

    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    if (!error) alert('Configurações salvas')
    else console.error('Erro ao salvar configurações', error)
  } catch (err) {
    console.error('Erro ao fazer upload de arquivos', err)
    alert('Erro ao salvar configurações. Verifique os uploads e tente novamente.')
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <div>
        <p class="settings-breadcrumb">Admin • Configurações</p>
        <h1 class="settings-title">Configurações gerais</h1>
        <p class="settings-subtitle">
          Gerencie informações de contato, WhatsApp e o conteúdo visual da página inicial.
        </p>
      </div>
      <div class="settings-header-actions">
        <button class="btn primary" @click="save">Salvar alterações</button>
      </div>
    </div>

    <div class="settings-grid">
      <section class="settings-card">
        <h2 class="card-title">Contato e WhatsApp</h2>
        <p class="card-description">Defina o número, horários e mensagens usadas no atendimento.</p>

        <div class="form-grid">
          <div class="form-field">
            <label class="field-label" for="whatsapp_number">Número WhatsApp</label>
            <input
              id="whatsapp_number"
              v-model="settings.whatsapp_number"
              class="field-input"
              placeholder="Ex: 5511999999999"
            />
          </div>

          <div class="form-field full">
            <label class="field-label" for="business_hours">Horários de atendimento</label>
            <textarea
              id="business_hours"
              v-model="settings.business_hours"
              class="field-textarea"
              rows="2"
              placeholder="Ex: 09:00 - 18:00, seg a sex"
            />
          </div>

          <div class="form-field full">
            <label class="field-label" for="welcome_message">Mensagem de boas-vindas</label>
            <textarea
              id="welcome_message"
              v-model="settings.welcome_message"
              class="field-textarea"
              rows="3"
              placeholder="Mensagem enviada quando o cliente inicia o atendimento."
            />
          </div>

          <div class="form-field full">
            <label class="field-label" for="contact_info">Informações de contato</label>
            <textarea
              id="contact_info"
              v-model="settings.contact_info"
              class="field-textarea"
              rows="3"
              placeholder="Endereço, e-mail ou outras informações de contato."
            />
          </div>

          <div class="form-field full">
            <label class="field-label" for="whatsapp_template">Template WhatsApp</label>
            <textarea
              id="whatsapp_template"
              v-model="settings.whatsapp_template"
              class="field-textarea"
              rows="4"
              placeholder="Mensagem modelo usada para o pedido via WhatsApp."
            />
          </div>

          <div class="form-field full">
            <label class="field-label" for="topbar_message">Mensagem de destaque no topo</label>
            <textarea
              id="topbar_message"
              v-model="settings.topbar_message"
              class="field-textarea"
              rows="2"
              placeholder="Ex: Vagas limitadas para ceias de Natal. Garanta seu pedido até 15/12."
            />
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="card-title">Banner da página inicial</h2>
        <p class="card-description">
          Configure o texto sobre o banner e envie a imagem que será exibida na Home.
        </p>

        <div class="form-grid">
          <div class="form-field full">
            <label class="field-label" for="home_banner_title">Texto sobre o banner</label>
            <input
              id="home_banner_title"
              v-model="settings.home_banner_title"
              class="field-input"
              placeholder="Ex: Bem-vindo ao Cardápio Natalino Affetto"
            />
          </div>

          <div class="form-field full">
            <label class="field-label">Imagem do banner</label>
            <div class="upload-row">
              <label class="upload-button">
                <span>Escolher imagem</span>
                <input type="file" accept="image/*" @change="onBannerSelected" />
              </label>
              <div class="upload-info">
                <p class="upload-text">JPG ou PNG, recomendado 1600x600px.</p>
                <p v-if="settings.home_banner_image_url" class="upload-text small">
                  Imagem atual configurada.
                </p>
              </div>
            </div>

            <div v-if="settings.home_banner_image_url" class="banner-preview">
              <img :src="settings.home_banner_image_url" alt="Banner atual" />
            </div>
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="card-title">Identidade visual</h2>
        <p class="card-description">Envie a logomarca que será usada no topo do site.</p>

        <div class="form-grid">
          <div class="form-field full">
            <label class="field-label" for="brand_name">Nome exibido no topo</label>
            <input
              id="brand_name"
              v-model="settings.brand_name"
              class="field-input"
              placeholder="Ex: Affetto"
            />
          </div>

          <div class="form-field full">
            <label class="field-label">Logomarca</label>
            <div class="upload-row">
              <label class="upload-button">
                <span>Escolher logo</span>
                <input type="file" accept="image/*" @change="onLogoSelected" />
              </label>
              <div class="upload-info">
                <p class="upload-text">PNG com fundo transparente recomendado.</p>
                <p v-if="settings.logo_url" class="upload-text small">Logo atual configurada.</p>
              </div>
            </div>

            <div v-if="settings.logo_url" class="logo-preview">
              <img :src="settings.logo_url" alt="Logomarca atual" />
            </div>
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="card-title">Páginas informativas</h2>
        <p class="card-description">Defina os textos exibidos nas páginas Como encomendar e Termos de serviço.</p>

        <div class="form-grid">
          <div class="form-field full">
            <label class="field-label" for="how_to_order_text">Texto "Como encomendar"</label>
            <textarea
              id="how_to_order_text"
              v-model="settings.how_to_order_text"
              class="field-textarea"
              rows="4"
              placeholder="Explique passo a passo como o cliente faz o pedido da ceia."
            />
          </div>

          <div class="form-field full">
            <label class="field-label" for="terms_text">Texto "Termos de serviço"</label>
            <textarea
              id="terms_text"
              v-model="settings.terms_text"
              class="field-textarea"
              rows="4"
              placeholder="Inclua as condições de venda, prazos, política de cancelamento etc."
            />
          </div>
        </div>
      </section>
    </div>

    <div class="settings-footer">
      <button class="btn primary" @click="save">Salvar alterações</button>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.settings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.settings-breadcrumb {
  font-size: 13px;
  color: #8b5b3e;
  margin: 0 0 4px;
}

.settings-title {
  font-size: 24px;
  font-weight: 700;
  color: #3b2b2b;
  margin: 0 0 4px;
}

.settings-subtitle {
  font-size: 14px;
  color: #6b5b4b;
  margin: 0;
}

.settings-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 18px 18px;
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #3b2b2b;
  margin: 0 0 4px;
}

.card-description {
  font-size: 13px;
  color: #6b5b4b;
  margin: 0 0 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px 16px;
}

.form-field.full {
  grid-column: 1 / -1;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4b3b3b;
  margin-bottom: 4px;
}

.field-input,
.field-textarea {
  width: 100%;
  border-radius: 10px;
  border: 1px solid #d4c8bc;
  padding: 8px 10px;
  font-size: 14px;
  color: #3b2b2b;
  background: #fdf8f4;
}

.field-input:focus,
.field-textarea:focus {
  outline: none;
  border-color: #b31919;
  box-shadow: 0 0 0 1px rgba(179, 25, 25, 0.1);
}

.field-textarea {
  min-height: 72px;
  resize: vertical;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: #f97373;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.upload-button input[type='file'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upload-text {
  font-size: 12px;
  color: #6b5b4b;
}

.upload-text.small {
  font-size: 11px;
}

.banner-preview {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.5);
}

.banner-preview img {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
}

.logo-preview {
  margin-top: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fdf8f4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-preview img {
  max-height: 64px;
  max-width: 200px;
  object-fit: contain;
}

.settings-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.btn {
  border: 1px solid #ddd;
  background: #ffffff;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.primary {
  background: #b31919;
  color: #ffffff;
  border-color: #b31919;
}

@media (max-width: 900px) {
  .settings-page {
    padding-inline: 12px;
  }
}
</style>