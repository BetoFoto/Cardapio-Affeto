/**
 * Composable para formatação de moeda no padrão brasileiro (R$)
 * - Vírgula (,) para decimais
 * - Ponto (.) para milhares
 */

export function useCurrency() {
  /**
   * Formata número para string no padrão brasileiro
   * Ex: 1250.99 -> "1.250,99"
   */
  const formatToBRL = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return ''
    
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  /**
   * Formata número para string com símbolo R$
   * Ex: 1250.99 -> "R$ 1.250,99"
   */
  const formatToBRLWithSymbol = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return ''
    
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  /**
   * Converte string no padrão brasileiro para número
   * Ex: "1.250,99" -> 1250.99
   */
  const parseBRL = (value: string): number => {
    if (!value || value.trim() === '') return 0
    
    // Remove tudo exceto números, vírgula e ponto
    let cleaned = value.replace(/[^\d.,]/g, '')
    
    // Remove pontos de milhar e troca vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Aplica máscara de moeda enquanto digita
   * Permite apenas números e formata automaticamente
   */
  const maskCurrency = (value: string): string => {
    // Remove tudo que não é número
    let numbers = value.replace(/\D/g, '')
    
    if (numbers === '') return ''
    
    // Converte para centavos e depois para reais
    const cents = parseInt(numbers, 10)
    const reais = cents / 100
    
    return formatToBRL(reais)
  }

  return {
    formatToBRL,
    formatToBRLWithSymbol,
    parseBRL,
    maskCurrency
  }
}
