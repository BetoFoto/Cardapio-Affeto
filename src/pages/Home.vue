<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import { supabase } from '../lib/supabase'

const bannerTitle = ref<string | null>(null)
const bannerImageUrl = ref<string | null>(null)
const bannerText = ref<string | null>(null)
const whatsappNumber = ref<string | null>(null)
const businessHours = ref<string | null>(null)
const contactInfo = ref<string | null>(null)
const brandName = ref<string>('Affetto')

const heroStyle = computed(() => {
  if (bannerImageUrl.value) {
    return {
      backgroundImage: `url(${bannerImageUrl.value})`,
    }
  }
  return {}
})

const whatsappLink = computed(() => {
  if (!whatsappNumber.value) return null
  const digits = whatsappNumber.value.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
})

const loadSettings = async () => {
  if (!supabase) return
  const { data, error } = await supabase.from('settings').select('key,value')
  if (error || !data) return
  const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
  bannerTitle.value = map.home_banner_title || null
  bannerImageUrl.value = map.home_banner_image_url || null
  bannerText.value = map.welcome_message || null
   whatsappNumber.value = map.whatsapp_number || null
   businessHours.value = map.business_hours || null
   contactInfo.value = map.contact_info || null
   if (map.brand_name) brandName.value = map.brand_name as string
}

onMounted(loadSettings)
</script>

<template>
  <div class="home-root">
    <section class="hero">
      <div class="wrap">
        <div class="heroBox" :style="heroStyle">
          <div class="hero-text">
            <h1>{{ bannerTitle || 'Nossa Ceia de Natal Especial' }}</h1>
            <p>
              {{
                bannerText ||
                  'Sabores inesquecíveis para a sua celebração. Explore nosso cardápio e monte a ceia perfeita para compartilhar com quem você ama.'
              }}
            </p>
          </div>
        </div>
      </div>
    </section>
    <main class="catalog-shell" id="catalogo">
      <div class="catalog-card">
        <header class="catalog-header">
          <h2>Explore nosso cardápio</h2>
          <p>Escolha as categorias para montar uma ceia completa, do prato principal à sobremesa.</p>
        </header>
        <CategoryGrid />
        <footer class="footer">
          <div class="footer-inner">
            <div class="footer-left">
              <h3 class="footer-brand">{{ brandName }}</h3>
              <p class="footer-tagline">
                Ceias natalinas artesanais preparadas com carinho para a sua família.
              </p>
            </div>

            <div class="footer-right">
              <div class="footer-links">
                <router-link to="/como-encomendar">Como encomendar</router-link>
                <router-link to="/termos">Termos de serviço</router-link>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <span class="copy">2024 {{ brandName }}. Todos os direitos reservados.</span>
          </div>
        </footer>
      </div>
    </main>
    <section class="contact-shell" id="contato">
      <div class="contact-card">
        <h2 class="contact-title">Fale com a Affeto</h2>
        <p class="contact-subtitle">Estamos prontos para ajudar você a montar uma ceia inesquecível.</p>

        <div class="contact-grid">
          <div class="contact-block">
            <h3 class="contact-heading">Horários</h3>
            <p v-if="businessHours" class="contact-text">{{ businessHours }}</p>
            <p v-else class="contact-text">Atendimento em horário comercial.</p>
          </div>

          <div class="contact-block">
            <h3 class="contact-heading">WhatsApp</h3>
            <a
              v-if="whatsappNumber && whatsappLink"
              :href="whatsappLink"
              target="_blank"
              rel="noopener noreferrer"
              class="contact-link"
            >
              📱 {{ whatsappNumber }}
            </a>
            <p v-else class="contact-text">Número de WhatsApp ainda não configurado.</p>
          </div>

          <div class="contact-block">
            <h3 class="contact-heading">Informações de contato</h3>
            <p v-if="contactInfo" class="contact-text">{{ contactInfo }}</p>
            <p v-else class="contact-text">Adicione endereço ou e-mail na área de Configurações.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-root {
  min-height: calc(100vh - 60px);
  background: #f4f2f0;
}

.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px;
}

.hero {
  padding-top: 8px;
}

.heroBox {
  background-image: url('https://images.unsplash.com/photo-1609801261556-c6e5fd0c40a0?q=80&w=1600&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  border-radius: 24px;
  padding: 40px 26px;
  color: #fff;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
  position: relative;
  display: flex;
  align-items: flex-end;
}

.heroBox::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55));
  border-radius: 24px;
  pointer-events: none;
  z-index: 0;
}

.hero-text {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.hero-text h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.hero-text p {
  margin: 0;
  font-size: 15px;
}

.heroCta {
  display: inline-block;
  margin-top: 16px;
  background: #f7d87c;
  color: #4a3b16;
  border: 1px solid #e6c766;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
}

.catalog-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

.catalog-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 20px 18px 20px;
  border: 1px solid #e3d8d3;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
}

.catalog-header h2 {
  margin: 0;
  font-size: 22px;
}

.catalog-header p {
  margin: 4px 0 16px;
  font-size: 14px;
  color: #6b5a5a;
}

.footer {
  margin-top: 24px;
  border-top: 1px solid #f5d5c0;
  padding-top: 18px;
  color: #4b4b4b;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
}

.footer-left {
  max-width: 420px;
}

.footer-brand {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #8c1c1c;
}

.footer-tagline {
  margin: 0;
  font-size: 13px;
  color: #7b5a4a;
}

.footer-right {
  display: flex;
  justify-content: flex-end;
  font-size: 13px;
}

.footer-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-icon {
  font-size: 14px;
}

.footer-text {
  color: #4b4b4b;
}

.footer-link {
  color: #b31919;
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 4px;
}

.footer-links a {
  font-size: 13px;
  font-weight: 600;
  color: #7b5a4a;
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}

.footer-bottom {
  margin-top: 14px;
  text-align: center;
}

.copy {
  font-size: 12px;
  color: #9b7b6b;
}

.contact-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

.contact-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #faf5f0, #fdf2f2);
  border-radius: 20px;
  padding: 18px 18px 20px;
  border: 1px solid #f0d6c8;
}

.contact-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #8c1c1c;
}

.contact-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  color: #735b4b;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 16px;
}

.contact-block {
  font-size: 13px;
}

.contact-heading {
  margin: 0 0 4px;
  font-weight: 600;
  color: #5b3b2b;
}

.contact-text {
  margin: 0;
  color: #4b4b4b;
}

.contact-link {
  color: #b31919;
  text-decoration: none;
}

.contact-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .hero {
    margin-inline: -16px;
  }

  .heroBox {
    padding: 22px 16px;
    border-radius: 0;
    box-shadow: none;
  }

  .hero-text h1 {
    font-size: 20px;
    line-height: 1.25;
  }

  .hero-text p {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.4;
  }

  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (min-width: 900px) {
  .heroBox {
    padding-top: 72px;
    padding-bottom: 72px;
  }
}
</style>
