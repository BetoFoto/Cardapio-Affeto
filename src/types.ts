export type SizeOption = { label: string; price: number }

// Faixa de preço por quantidade de convidados
export type PriceTier = {
  id: string
  product_id: string
  label: string           // Ex: "Até 50 Convidados"
  max_guests: number      // Ex: 50
  price: number           // Ex: 6500.00
  display_order?: number
  created_at?: string
  updated_at?: string
}

// Modo de precificação do produto
export type PricingMode = 'unit' | 'tiers' | 'both'

// Produto legado (mantido para compatibilidade)
export type Product = {
  id: string
  category_id: string
  name: string
  slug?: string
  description?: string
  image_url?: string
  base_price?: number
  has_size_options?: boolean
  size_5p_price?: number
  size_10p_price?: number
  display_order?: number
  active: boolean
  created_at?: string
  updated_at?: string
}

// Produto expandido para buffet (estende Product)
export type BuffetProduct = Product & {
  long_description?: string   // Descrição longa com listas
  observations?: string       // Observações (ex: "Bebidas alcoólicas a consultar")
  pricing_mode?: PricingMode  // Modo de preço
  price_tiers?: PriceTier[]   // Faixas de preço (relacionamento)
}

// Item do carrinho legado (mantido para compatibilidade)
export type CartItem = {
  productId: string
  name: string
  image_url?: string
  unitPrice: number
  sizeLabel?: string
  quantity: number
  subtotal: number
}

// Item do carrinho adaptado para buffet
export type BuffetCartItem = {
  productId: string
  name: string
  image_url?: string
  
  // Para produtos com faixa de convidados
  priceTierId?: string
  tierLabel?: string
  tierPrice?: number
  
  // Para produtos unitários
  unitPrice?: number
  quantity: number
  
  // Campos legados (compatibilidade)
  sizeLabel?: string
  
  subtotal: number
}

export type Order = {
  id?: string
  order_number?: string
  customer_name: string
  customer_whatsapp: string
  customer_address: string
  delivery_date: string
  delivery_time: string
  subtotal?: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  whatsapp_sent?: boolean
  whatsapp_sent_at?: string
  created_at?: string
  updated_at?: string
  admin_tag_label?: string
  admin_tag_color?: string
}

export type SettingsKV = { 
  id?: string; 
  key: string; 
  value: string; 
  description?: string; 
  created_at?: string; 
  updated_at?: string 
}