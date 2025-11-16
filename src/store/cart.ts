import { defineStore } from 'pinia'
import type { CartItem, Product, SizeOption } from '../types'

type State = { items: CartItem[] }

const calcTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.subtotal, 0)

export const useCartStore = defineStore('cart', {
  state: (): State => ({ items: JSON.parse(localStorage.getItem('cart') || '[]') }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.quantity, 0),
    total: (s) => calcTotal(s.items),
  },
  actions: {
    persist() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    },
    add(product: Product, size?: SizeOption) {
      const unitPrice = size ? size.price : (Number(product.base_price || 0))
      const key = `${product.id}-${size?.label || ''}`
      const existing = this.items.find((i) => `${i.productId}-${i.sizeLabel || ''}` === key)
      if (existing) {
        existing.quantity += 1
        existing.subtotal = existing.quantity * existing.unitPrice
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
      item.quantity = Math.max(1, quantity)
      item.subtotal = item.quantity * item.unitPrice
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