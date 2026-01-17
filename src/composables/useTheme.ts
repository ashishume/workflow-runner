import { ref, watch } from 'vue'

export interface UseThemeOptions {
  storageKey?: string
  defaultDark?: boolean
}

export function useTheme(options: UseThemeOptions = {}) {
  const { storageKey = 'darkMode', defaultDark = true } = options

  // Initialize from localStorage or default
  const getInitialValue = (): boolean => {
    if (typeof window === 'undefined') return defaultDark
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      return stored === 'true'
    }
    // Check system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return defaultDark
  }

  const isDarkMode = ref(getInitialValue())

  // Apply theme to document
  const applyTheme = (dark: boolean) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('light-mode', !dark)
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  // Set dark mode explicitly
  const setDarkMode = (dark: boolean) => {
    isDarkMode.value = dark
  }

  // Watch and persist changes
  watch(
    isDarkMode,
    (dark) => {
      applyTheme(dark)
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(dark))
      }
    },
    { immediate: true }
  )

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
  }
}
