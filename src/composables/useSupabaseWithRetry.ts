import { ref } from 'vue'
import { supabase } from '../lib/supabase'

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  onRetry?: (attempt: number) => void
}

interface SupabaseState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retrying: boolean
}

export function useSupabaseWithRetry<T>() {
  const state = ref<SupabaseState<T>>({
    data: null,
    loading: false,
    error: null,
    retrying: false,
  })

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const getFriendlyErrorMessage = (error: any): string => {
    // Erros de rede
    if (!navigator.onLine) {
      return 'Você está sem conexão com a internet. Verifique sua rede e tente novamente.'
    }

    // Erros específicos do Supabase
    if (error?.code) {
      switch (error.code) {
        case 'PGRST116':
          return 'Dados não encontrados.'
        case 'PGRST301':
          return 'Limite de requisições excedido. Aguarde um momento e tente novamente.'
        case '23505':
          return 'Este registro já existe.'
        case '42P01':
          return 'Tabela não encontrada. Entre em contato com o suporte.'
        case '42501':
          return 'Permissão negada. Verifique suas credenciais.'
        default:
          break
      }
    }

    // Erros HTTP
    if (error?.status) {
      switch (error.status) {
        case 401:
          return 'Sessão expirada. Faça login novamente.'
        case 403:
          return 'Acesso negado. Você não tem permissão para esta ação.'
        case 404:
          return 'Recurso não encontrado.'
        case 408:
          return 'Tempo de espera esgotado. Tente novamente.'
        case 429:
          return 'Muitas requisições. Aguarde um momento.'
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Erro no servidor. Tente novamente em alguns instantes.'
        default:
          break
      }
    }

    // Mensagem genérica amigável
    return 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
  }

  const execute = async (
    operation: () => Promise<{ data: T | null; error: any }>,
    options: RetryOptions = {},
  ): Promise<T | null> => {
    const { maxRetries = 3, delayMs = 1000, onRetry } = options

    state.value.loading = true
    state.value.error = null
    state.value.retrying = false

    let lastError: any = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Verifica conexão antes de tentar
        if (!navigator.onLine) {
          throw new Error('offline')
        }

        const { data, error } = await operation()

        if (error) {
          throw error
        }

        state.value.data = data as any
        state.value.loading = false
        state.value.retrying = false
        return data
      } catch (err: any) {
        lastError = err

        // Se for a última tentativa, retorna erro
        if (attempt === maxRetries) {
          break
        }

        // Erros que não devem ter retry
        const nonRetryableCodes = ['PGRST116', '42501', '401', '403', '404']
        if (nonRetryableCodes.includes(err?.code) || nonRetryableCodes.includes(String(err?.status))) {
          break
        }

        // Retry
        state.value.retrying = true
        onRetry?.(attempt + 1)
        await sleep(delayMs * (attempt + 1)) // Backoff exponencial
      }
    }

    state.value.loading = false
    state.value.retrying = false
    state.value.error = getFriendlyErrorMessage(lastError)
    return null
  }

  const clearError = () => {
    state.value.error = null
  }

  const reset = () => {
    state.value.data = null
    state.value.loading = false
    state.value.error = null
    state.value.retrying = false
  }

  return {
    state,
    execute,
    clearError,
    reset,
  }
}

// Hook específico para operações comuns
export function useSupabaseQuery() {
  const { state, execute, clearError, reset } = useSupabaseWithRetry<any[]>()

  const fetchFrom = async (table: string, options?: { eq?: Record<string, any>; order?: { column: string; ascending?: boolean } }) => {
    if (!supabase) {
      state.value.error = 'Conexão com o banco de dados não configurada.'
      return null
    }

    return execute(async () => {
      let query = supabase!.from(table).select('*')

      if (options?.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (options?.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
      }

      return await query
    })
  }

  return {
    state,
    fetchFrom,
    clearError,
    reset,
  }
}
