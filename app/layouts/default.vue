<template>
  <div class="min-h-screen bg-white dark:bg-dark transition-colors duration-200 relative">
    <div class="relative z-10">
      <!-- Minimal Nav -->
      <div class="sticky top-0 z-50 bg-white/80 dark:bg-dark/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div class="xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4 py-3">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-4">
              <Logo />
              <div class="hidden sm:block h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
              <span class="hidden sm:block text-sm font-clash font-medium text-campaign">Gift-a-Challenge</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main>
        <slot />
      </main>

      <!-- Footer -->
      <footer class="bg-neutral-100 dark:bg-neutral-900 pt-10 pb-8">
        <div class="xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4">
          <div class="space-y-8">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div class="flex items-center gap-3">
                <Logo />
                <span class="text-sm text-neutral-500">&copy; {{ new Date().getFullYear() }} TradersYard GmbH</span>
              </div>
              <div class="flex items-center gap-6 text-sm text-neutral-500">
                <a href="https://tradersyard.com/legal/terms" class="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Terms</a>
                <a href="https://tradersyard.com/legal/privacy" class="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Privacy</a>
                <a href="https://tradersyard.com/legal/refund" class="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">Refund Policy</a>
              </div>
            </div>
            <div class="border-t border-neutral-200 dark:border-neutral-800" />
            <p class="text-center text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              All accounts provided to clients are demo accounts with virtual funds. All trading takes place in a simulated environment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useTheme } from '~/composables/useTheme'

onMounted(() => {
  const { initializeTheme } = useTheme()
  initializeTheme()
})
</script>
