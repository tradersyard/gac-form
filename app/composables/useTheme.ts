// ~/composables/useTheme.ts
export const useTheme = () => {
  const theme = useState<'light' | 'dark'>('theme', () => 'light')
  const initialized = useState<boolean>('theme:initialized', () => false)
  const userPrefCookie = useCookie<'light' | 'dark' | null>('theme', { sameSite: 'lax' })

  const applyTheme = () => {
    if (!import.meta.client) return
    const root = document.documentElement
    theme.value === 'dark' ? root.classList.add('dark') : root.classList.remove('dark')
    root.setAttribute('data-theme', theme.value) // optional, helpful for CSS
  }

  const setTheme = (t: 'light' | 'dark') => {
    theme.value = t
    if (import.meta.client) userPrefCookie.value = t
  }

  const toggleTheme = () => setTheme(theme.value === 'light' ? 'dark' : 'light')

  const initializeTheme = () => {
    if (!import.meta.client || initialized.value) return

    // 1) use stored user preference if present
    const stored = userPrefCookie.value ?? localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      theme.value = stored
    } else {
      // 2) fall back to system preference
      theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    // 3) keep following OS changes only if user didn't explicitly choose
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      // only auto-switch if no explicit user choice in cookie/localStorage
      if (!userPrefCookie.value && !localStorage.getItem('theme')) {
        theme.value = e.matches ? 'dark' : 'light'
      }
    }
    mq.addEventListener?.('change', onChange)

    // store remover so it runs once per app
    const remove = () => mq.removeEventListener?.('change', onChange)
    // register cleanup when app is destroyed (rare) or page unload
    window.addEventListener('pagehide', remove, { once: true })

    initialized.value = true
  }

  // apply on any change (and immediately on mount)
  if (import.meta.client) {
    const stop = watch(theme, applyTheme, { immediate: true })
    onMounted(() => {
      initializeTheme()
      // optional: stop the watcher on unmount of the last component using it
      // but since this composable is app-scoped, leaving it is fine
    })
  }

  return {
    // keep it write-protected from components; they should use the setters
    theme: readonly(theme),
    toggleTheme,
    setTheme,
    initializeTheme,
  }
}
