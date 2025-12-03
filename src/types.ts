export type SizeOption = { label: string; price: number }

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

export type CartItem = {
  productId: string
  name: string
  image_url?: string
  unitPrice: number
  sizeLabel?: string
  quantity: number
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