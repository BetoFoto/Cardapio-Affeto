<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCurrency } from '../composables/useCurrency'

const props = defineProps<{
  modelValue: number
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { formatToBRL, parseBRL } = useCurrency()

const displayValue = ref('')

// Sincroniza valor externo -> display
watch(() => props.modelValue, (newVal) => {
  const currentParsed = parseBRL(displayValue.value)
  // Só atualiza se o valor realmente mudou (evita loop)
  if (Math.abs(currentParsed - (newVal || 0)) > 0.001) {
    displayValue.value = newVal ? formatToBRL(newVal) : ''
  }
}, { immediate: true })

onMounted(() => {
  if (props.modelValue) {
    displayValue.value = formatToBRL(props.modelValue)
  }
})

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value
  
  // Remove caracteres não numéricos exceto vírgula e ponto
  value = value.replace(/[^\d.,]/g, '')
  
  // Garante apenas uma vírgula
  const parts = value.split(',')
  if (parts.length > 2) {
    value = parts[0] + ',' + parts.slice(1).join('')
  }
  
  // Limita decimais a 2 dígitos
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + ',' + parts[1].slice(0, 2)
  }
  
  displayValue.value = value
  
  // Emite valor numérico
  const numericValue = parseBRL(value)
  emit('update:modelValue', numericValue)
}

const onBlur = () => {
  // Formata corretamente ao sair do campo
  const numericValue = parseBRL(displayValue.value)
  if (numericValue > 0) {
    displayValue.value = formatToBRL(numericValue)
  } else {
    displayValue.value = ''
  }
}
</script>

<template>
  <input
    type="text"
    inputmode="decimal"
    :value="displayValue"
    :placeholder="placeholder || '0,00'"
    @input="onInput"
    @blur="onBlur"
  />
</template>
