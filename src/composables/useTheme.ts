import { ref, onMounted } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'affeto-theme'

const currentTheme = ref<Theme>('system')
const isDark = ref(false)

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean) {
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useTheme() {
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem(STORAGE_KEY, theme)

    if (theme === 'system') {
      applyTheme(getSystemPreference())
    } else {
      applyTheme(theme === 'dark')
    }
  }

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  onMounted(() => {
    // Carrega tema salvo
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      currentTheme.value = saved
    }

    // Aplica tema inicial
    if (currentTheme.value === 'system') {
      applyTheme(getSystemPreference())
    } else {
      applyTheme(currentTheme.value === 'dark')
    }

    // Ouve mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (currentTheme.value === 'system') {
        applyTheme(e.matches)
      }
    })
  })

  return {
    currentTheme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
