<template>
  <section class="min-h-screen py-16 md:py-24 relative overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 -z-10 bg-gradient-to-b from-campaign/5 via-campaign/8 to-campaign/5 dark:from-campaign/10 dark:via-campaign/15 dark:to-campaign/10" />

    <!-- Floating hearts -->
    <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg class="absolute top-10 left-[10%] w-6 h-6 text-campaign/10 fill-current animate-float" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <svg class="absolute top-32 right-[15%] w-8 h-8 text-campaign/8 fill-current animate-float" style="animation-delay: 2s" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <svg class="absolute bottom-20 left-[20%] w-5 h-5 text-campaign/6 fill-current animate-float" style="animation-delay: 4s" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </div>

    <div class="xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-10 space-y-4">
          <div class="inline-block">
            <div class="rounded-full bg-campaign text-white px-4 py-1.5 text-[10px] font-light tracking-[1px] sm:tracking-[3px] uppercase">
              Gift a Challenge
            </div>
          </div>
          <h1 class="font-clash text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900 dark:text-white leading-tight">
            Nominate Your <span class="text-campaign">Gift Recipient</span>
          </h1>
          <p class="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
            You've earned a free challenge for someone special. Fill in the details below and we'll set them up.
          </p>
        </div>

        <!-- Success State -->
        <div v-if="submitted" class="space-y-8">
          <!-- Success Header -->
          <div class="text-center space-y-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 md:p-10">
            <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <IconCircleCheck class="w-8 h-8 text-green-600" />
            </div>
            <h2 class="font-clash text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">
              Nomination Submitted!
            </h2>
            <p class="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              We've received your gift nomination. Here's a summary of your submission.
            </p>
          </div>

          <!-- Submission Summary -->
          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <!-- Your Details -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-campaign/10 rounded-lg flex items-center justify-center">
                  <IconUser class="w-4 h-4 text-campaign" />
                </div>
                <h3 class="font-clash text-lg font-semibold text-neutral-900 dark:text-white">Your Details</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Name</p>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ form.buyerName }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Email</p>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ form.buyerEmail }}</p>
                </div>
              </div>
            </div>

            <div class="border-t border-neutral-200 dark:border-neutral-800" />

            <!-- Account Purchased -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-campaign/10 rounded-lg flex items-center justify-center">
                  <IconReceipt class="w-4 h-4 text-campaign" />
                </div>
                <h3 class="font-clash text-lg font-semibold text-neutral-900 dark:text-white">Account Purchased</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Challenge Type</p>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ selectedChallengeName }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Account Size</p>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ form.accountSize }}</p>
                </div>
              </div>
            </div>

            <div class="border-t border-neutral-200 dark:border-neutral-800" />

            <!-- Gift Recipient -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-campaign/10 rounded-lg flex items-center justify-center">
                  <IconHeartHandshake class="w-4 h-4 text-campaign" />
                </div>
                <h3 class="font-clash text-lg font-semibold text-neutral-900 dark:text-white">Gift Recipient</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Recipient Name</p>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ form.recipientName }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Recipient Email</p>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ form.recipientEmail }}</p>
                </div>
              </div>
              <div class="mt-4 flex items-start gap-3 bg-campaign/5 dark:bg-campaign/10 border border-campaign/20 rounded-xl p-4">
                <IconGift class="w-5 h-5 text-campaign mt-0.5 shrink-0" />
                <p class="text-sm text-neutral-700 dark:text-neutral-300">
                  A <span class="text-campaign font-semibold">FREE {{ selectedGiftTier }}</span> challenge will be sent to <span class="font-semibold">{{ form.recipientEmail }}</span> within <span class="font-semibold">48 hours</span>.
                </p>
              </div>
            </div>
          </div>

          <!-- Important Notice -->
          <div class="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-3">
            <h4 class="font-clash font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <IconInfoCircle class="w-5 h-5 text-campaign" />
              Important
            </h4>
            <ul class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li class="flex items-start gap-2">
                <IconCheck class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                The recipient must use a different email address than yours to claim their free challenge.
              </li>
              <li class="flex items-start gap-2">
                <IconCheck class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                The free challenge will be sent to <span class="font-medium text-neutral-900 dark:text-white">{{ form.recipientEmail }}</span> within 48 hours.
              </li>
              <li class="flex items-start gap-2">
                <IconCheck class="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                The gift challenge is fully functional with the same rules and path to funded.
              </li>
            </ul>
          </div>

          <!-- Back Button -->
          <div class="text-center">
            <a
              href="https://giftachallenge.vercel.app/gift-a-challenge"
              class="inline-flex gap-2 justify-center items-center font-clash font-medium tracking-wide transition-all border duration-300 bg-campaign text-white border-campaign hover:bg-campaign-dark text-lg px-6 py-3 rounded-xl"
            >
              Back to Campaign
            </a>
          </div>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Your Details -->
          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-campaign/10 rounded-lg flex items-center justify-center">
                <IconUser class="w-4 h-4 text-campaign" />
              </div>
              <h2 class="font-clash text-xl font-semibold text-neutral-900 dark:text-white">Your Details</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="space-y-2">
                <label for="buyerName" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Full Name</label>
                <input
                  id="buyerName"
                  v-model="form.buyerName"
                  type="text"
                  required
                  placeholder="Your full name"
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-campaign/50 focus:border-campaign transition-colors"
                />
              </div>
              <div class="space-y-2">
                <label for="buyerEmail" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
                <input
                  id="buyerEmail"
                  v-model="form.buyerEmail"
                  type="email"
                  required
                  placeholder="you@example.com"
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-campaign/50 focus:border-campaign transition-colors"
                />
              </div>
            </div>
          </div>

          <!-- Account Purchased -->
          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-campaign/10 rounded-lg flex items-center justify-center">
                <IconReceipt class="w-4 h-4 text-campaign" />
              </div>
              <h2 class="font-clash text-xl font-semibold text-neutral-900 dark:text-white">Account Purchased</h2>
            </div>

            <div class="space-y-5">
              <div class="space-y-2">
                <label for="challengeType" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Challenge Type</label>
                <select
                  id="challengeType"
                  v-model="form.challengeType"
                  required
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-campaign/50 focus:border-campaign transition-colors appearance-none"
                >
                  <option value="" disabled>Select your challenge type</option>
                  <option v-for="type in challengeTypes" :key="type.key" :value="type.key">
                    {{ type.name }}
                  </option>
                </select>
              </div>

              <div class="space-y-2">
                <label for="accountSize" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Size</label>
                <select
                  id="accountSize"
                  v-model="form.accountSize"
                  required
                  :disabled="!form.challengeType"
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-campaign/50 focus:border-campaign transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>{{ form.challengeType ? 'Select account size' : 'Select a challenge type first' }}</option>
                  <option v-for="account in availableAccounts" :key="account.value" :value="account.label">
                    {{ account.label }} — You gift: {{ account.giftTier }}
                  </option>
                </select>
              </div>

              <!-- Gift tier info -->
              <div v-if="selectedGiftTier" class="flex items-start gap-3 bg-campaign/5 dark:bg-campaign/10 border border-campaign/20 rounded-xl p-4">
                <IconGift class="w-5 h-5 text-campaign mt-0.5 shrink-0" />
                <div>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    Your recipient gets a <span class="text-campaign font-semibold">FREE {{ selectedGiftTier }}</span> challenge
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Based on your {{ form.accountSize }} purchase
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Gift Recipient -->
          <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-campaign/10 rounded-lg flex items-center justify-center">
                <IconHeartHandshake class="w-4 h-4 text-campaign" />
              </div>
              <h2 class="font-clash text-xl font-semibold text-neutral-900 dark:text-white">Gift Recipient</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="space-y-2">
                <label for="recipientName" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Recipient's Full Name</label>
                <input
                  id="recipientName"
                  v-model="form.recipientName"
                  type="text"
                  required
                  placeholder="Their full name"
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-campaign/50 focus:border-campaign transition-colors"
                />
              </div>
              <div class="space-y-2">
                <label for="recipientEmail" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Recipient's Email Address</label>
                <input
                  id="recipientEmail"
                  v-model="form.recipientEmail"
                  type="email"
                  required
                  placeholder="friend@example.com"
                  class="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-campaign/50 focus:border-campaign transition-colors"
                />
              </div>
            </div>

            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              The recipient must use a different email address than yours. The free challenge will be sent to this email within 48 hours.
            </p>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <IconAlertCircle class="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p class="text-sm text-red-700 dark:text-red-400">{{ errorMessage }}</p>
          </div>

          <!-- Submit -->
          <div class="text-center space-y-4">
            <button
              type="submit"
              :disabled="submitting"
              class="w-full sm:w-auto flex gap-2 justify-center items-center relative group overflow-hidden font-clash font-medium tracking-wide transition-all border duration-300 bg-campaign text-white border-campaign hover:bg-campaign-dark text-xl py-4 px-10 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <span v-if="submitting" class="flex items-center gap-2">
                <IconLoader2 class="w-5 h-5 animate-spin" />
                Submitting...
              </span>
              <span v-else>Submit Nomination</span>
            </button>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              By submitting, you confirm that you have purchased a challenge using code LOVE25 and wish to gift a free challenge to the recipient above.
            </p>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconUser, IconReceipt, IconHeartHandshake, IconGift, IconCircleCheck, IconAlertCircle, IconLoader2, IconInfoCircle, IconCheck } from '@tabler/icons-vue'
import { challengeTypes } from '~/data/gift-a-challenge'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Nominate Gift Recipient — Gift a Challenge | TradersYard',
  meta: [
    { name: 'description', content: 'Submit your gift nomination. Tell us who should receive a FREE trading challenge as part of the Gift a Challenge Valentine\'s campaign.' },
  ],
})

const form = ref({
  buyerName: '',
  buyerEmail: '',
  challengeType: '',
  accountSize: '',
  recipientName: '',
  recipientEmail: '',
})

const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const availableAccounts = computed(() => {
  const type = challengeTypes.find(t => t.key === form.value.challengeType)
  return type?.accounts ?? []
})

const selectedChallengeName = computed(() => {
  const type = challengeTypes.find(t => t.key === form.value.challengeType)
  return type?.name ?? ''
})

const selectedGiftTier = computed(() => {
  if (!form.value.challengeType || !form.value.accountSize) return null
  const type = challengeTypes.find(t => t.key === form.value.challengeType)
  const account = type?.accounts.find(a => a.label === form.value.accountSize)
  return account?.giftTier ?? null
})

async function handleSubmit() {
  errorMessage.value = ''

  if (form.value.buyerEmail.toLowerCase() === form.value.recipientEmail.toLowerCase()) {
    errorMessage.value = 'The recipient email must be different from your own email address.'
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/gac-form', {
      method: 'POST',
      body: {
        buyerName: form.value.buyerName,
        buyerEmail: form.value.buyerEmail,
        challengeType: form.value.challengeType,
        accountSize: form.value.accountSize,
        giftTier: selectedGiftTier.value,
        recipientName: form.value.recipientName,
        recipientEmail: form.value.recipientEmail,
      },
    })
    submitted.value = true
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Something went wrong. Please try again or contact support.'
  } finally {
    submitting.value = false
  }
}
</script>
