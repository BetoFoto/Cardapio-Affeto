import { defineStore } from 'pinia'
import type { 
  Product, 
  SizeOption, 
  BuffetProduct, 
  BuffetCartItem, 
  PriceTier 
} from '../types'

type State = { items: BuffetCartItem[] }

export const useCartStore = defineStore('cart', {
  state: (): State => ({ 
    items: JSON.parse(localStorage.getItem('cart') || '[]') 
  }),
  
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.quantity, 0),
    total: (s) => s.items.reduce((sum, i) => sum + i.subtotal, 0),
  },
  
  actions: {
    persist() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    // Adicionar produto com faixa de convidados
    addWithTier(product: BuffetProduct, tier: PriceTier) {
      // Faixas não acumulam - verifica se já existe
      const existing = this.items.find(i => 
        i.productId === product.id && i.priceTierId === tier.id
      )
      
      if (existing) {
        // Já existe essa faixa no carrinho, não adiciona novamente
        return
      }
      
      this.items.push({
        productId: product.id,
        name: product.name,
        image_url: product.image_url,
        priceTierId: tier.id,
        tierLabel: tier.label,
        tierPrice: tier.price,
        quantity: 1,
        subtotal: tier.price
      })
      this.persist()
    },

    // Adicionar produto unitário (novo modelo)
    addUnit(product: BuffetProduct) {
      const existing = this.items.find(i => 
        i.productId === product.id && 
        !i.priceTierId && 
        !i.sizeLabel
      )
      
      const price = product.base_price || 0
      
      if (existing) {
        existing.quantity += 1
        existing.subtotal = existing.quantity * (existing.unitPrice || 0)
      } else {
        this.items.push({
          productId: product.id,
          name: product.name,
          image_url: product.image_url,
          unitPrice: price,
          quantity: 1,
          subtotal: price
        })
      }
      this.persist()
    },

    // Método legado - mantido para compatibilidade com produtos antigos
    add(product: Product, size?: SizeOption) {
      const unitPrice = size ? size.price : (Number(product.base_price || 0))
      const key = `${product.id}-${size?.label || ''}`
      const existing = this.items.find((i) => 
        `${i.productId}-${i.sizeLabel || ''}` === key
      )
      
      if (existing) {
        existing.quantity += 1
        existing.subtotal = existing.quantity * (existing.unitPrice || 0)
      } else {
        this.items.push({
          productId: product.id,
          name: product.name,
          image_url: product.image_url,
          unitPrice,
          sizeLabel: size?.label,
          quantity: 1,
          subtotal: unitPrice,
        })
      }
      this.persist()
    },

    updateQuantity(index: number, quantity: number) {
      const item = this.items[index]
      if (!item) return
      
      // Itens com faixa de preço não permitem alterar quantidade
      if (item.priceTierId) return
      
      item.quantity = Math.max(1, quantity)
      // Calcula subtotal baseado no tipo de preço
      const price = item.unitPrice || item.tierPrice || 0
      item.subtotal = item.quantity * price
      this.persist()
    },

    remove(index: number) {
      this.items.splice(index, 1)
      this.persist()
    },

    clear() {
      this.items = []
      this.persist()
    },
  },
})
