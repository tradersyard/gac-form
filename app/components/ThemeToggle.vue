<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-900"
    :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
  >
    <component :is="theme === 'dark' ? IconSun : IconMoon" class="text-primary size-7 md:size-5" />
  </button>
</template>

<script setup lang="ts">
import { IconSun, IconMoon } from '@tabler/icons-vue'
import { useTheme } from '~/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>
