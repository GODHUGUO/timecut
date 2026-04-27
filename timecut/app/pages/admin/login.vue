<script setup lang="ts">
definePageMeta({ layout: false })

const { verifyAdminPassword } = useAdmin()
const password = ref('')
const error = ref('')
const loading = ref(false)

const submitPassword = async () => {
  if (!password.value) return
  try {
    loading.value = true
    error.value = ''
    const result = await verifyAdminPassword(password.value)
    if ((result as any)?.valid) {
      sessionStorage.setItem('admin_authenticated', 'true')
      navigateTo('/admin')
    } else {
      error.value = 'Mot de passe incorrect'
    }
  } catch (e: any) {
    error.value = e.message || 'Erreur de vérification'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#191022] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-8">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-xl bg-[#7f13ec] flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:shield-check" class="w-7 h-7 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white">TimeCut Admin</h1>
          <p class="text-gray-400 text-sm mt-2">Entrez le mot de passe administrateur pour continuer</p>
        </div>

        <!-- Password Form -->
        <form @submit.prevent="submitPassword" class="space-y-4">
          <div>
            <label class="text-sm text-gray-400 mb-1 block">Mot de passe</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7f13ec] transition-colors"
              autofocus
            />
          </div>

          <div v-if="error" class="text-red-400 text-sm text-center">{{ error }}</div>

          <button
            type="submit"
            :disabled="loading || !password"
            class="w-full py-3 bg-[#7f13ec] hover:bg-[#a855f7] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{{ loading ? 'Vérification...' : 'Accéder' }}</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <NuxtLink to="/" class="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">
            ← Retour à l'accueil
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
