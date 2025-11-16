# Cardápio de Natal Affetto

Aplicação web PWA em Vue 3 + TypeScript + Vite, com Pinia (estado), Vue Router (rotas) e Supabase (dados e Auth). Permite navegar pelo cardápio, montar carrinho e finalizar pedido via WhatsApp. Possui área administrativa com autenticação.

## Requisitos

- Node.js 18+
- Conta e projeto no Supabase (Postgres, Auth e Storage habilitados)

## Variáveis de ambiente (.env.local)

Crie um arquivo `.env.local` na raiz com:

```
VITE_WHATSAPP_NUMBER=55XXXXXXXXXXX
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Executar em desenvolvimento

```
npm install
npm run dev
```

Aplicação em: http://localhost:5173

## Build e preview

```
npm run build
npm run preview
```

## Deploy

- Funciona bem em Vercel, Netlify ou qualquer host estático que sirva `dist/`.
- Configure as mesmas variáveis de ambiente no provedor de deploy.

## PWA

- Registrado via `vite-plugin-pwa` (autoUpdate).
- Manifesto e ícones configurados em `vite.config.ts`.
- Cache de imagens (CacheFirst) e páginas (StaleWhileRevalidate).

## Admin e autenticação

- Login: `/admin` (Supabase Auth com e-mail/senha).
- Rotas protegidas: `/admin/dashboard`, `/admin/produtos`, `/admin/pedidos`, `/admin/config` (guard na `router.beforeEach`).

## Tabelas esperadas no Supabase (sugestão)

- `products`: id, name, description, category, price, image_url, active (bool), sizes (opcional JSON)
- `orders`: id, customer_name, customer_phone, address, preferred_date, preferred_time, items (JSON), total (numeric), status, created_at
- `settings`: whatsapp_number, business_hours, welcome_message, contact_info, whatsapp_template
- Storage bucket: `product-images`

## WhatsApp

- O checkout gera texto e abre `wa.me/{VITE_WHATSAPP_NUMBER}` com a mensagem.

## Notas

- Se `VITE_SUPABASE_URL/KEY` não estiverem definidos, o app funciona sem persistir pedidos.
- Dependências limpas: removidos pacotes não usados de React.
