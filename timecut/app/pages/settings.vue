<template>
  <div class="space-y-6 pb-24">
    <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-white font-semibold text-base">Profil utilisateur</h3>
          <p class="text-gray-400 text-xs mt-0.5">Gérez vos informations de compte.</p>
        </div>
        <button
          @click="saveProfile"
          class="px-4 py-2 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Nom complet</label>
          <input
            v-model="profile.name"
            type="text"
            class="w-full bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7f13ec] transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Adresse email</label>
          <input
            v-model="profile.email"
            type="email"
            class="w-full bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7f13ec] transition-colors"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
            <Icon name="lucide:sparkles" class="w-4 h-4 text-[#7f13ec]" />
          </div>
          <h3 class="text-white font-semibold text-base">Préférences IA</h3>
        </div>

        <div class="space-y-5">
          <div class="bg-[#2a1a44] border border-[#7f13ec]/20 rounded-xl p-4 flex items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div>
                  <p class="text-white text-sm font-medium">Traduire les sous-titres</p>
                  <p class="text-gray-500 text-xs mt-1">
                    Plan actuel : {{ currentPlanDetails.name }}.
                  </p>
                </div>
                <button
                  @click="toggleTranslation"
                  :disabled="!subscription?.canTranslateSubtitles"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
                  :class="!subscription?.canTranslateSubtitles
                    ? 'bg-gray-800 cursor-not-allowed'
                    : ai.translationEnabled ? 'bg-[#7f13ec]' : 'bg-gray-700'"
                >
                  <span
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    :class="ai.translationEnabled ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>
              <p class="text-gray-400 text-xs leading-relaxed">
                Désactivé par défaut. Quand activé, les prochaines vidéos générées auront des sous-titres traduits.
              </p>
              <p v-if="!subscription?.canTranslateSubtitles" class="text-amber-300 text-xs leading-relaxed mt-2">
                Cette option est disponible uniquement avec les plans Starter et Pro.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-2 uppercase tracking-wide">Langue cible des sous-titres</label>
            <div class="relative">
              <select
                v-model="ai.language"
                :disabled="!ai.translationEnabled || !subscription?.canTranslateSubtitles"
                class="w-full bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg px-3 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-[#7f13ec] transition-colors"
              >
                <option value="fr">Français (France)</option>
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="ar">العربية</option>
              </select>
              <Icon name="lucide:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs text-gray-400 uppercase tracking-wide">Style des sous-titres</label>
              <span v-if="aiSaveStatus === 'saving'" class="text-xs text-gray-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse inline-block"></span>
                Sauvegarde...
              </span>
              <span v-else-if="aiSaveStatus === 'saved'" class="text-xs text-green-400 flex items-center gap-1">
                <Icon name="lucide:check" class="w-3 h-3" /> Sauvegardé
              </span>
            </div>
            <div class="flex gap-2">
              <button
                v-for="style in captionStyles"
                :key="style.value"
                @click="ai.captionStyle = style.value"
                class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors border"
                :class="ai.captionStyle === style.value
                  ? 'bg-[#7f13ec] border-[#7f13ec] text-white'
                  : 'bg-[#2a1a44] border-[#7f13ec]/20 text-gray-300 hover:border-[#7f13ec]/50'"
              >
                {{ style.label }}
              </button>
            </div>
          </div>

          <div class="bg-[#2a1a44] rounded-xl p-4 flex items-center justify-center min-h-15">
            <p
              class="text-sm text-center transition-all"
              :class="{
                'font-black text-white tracking-wide': ai.captionStyle === 'bold',
                'font-normal text-white': ai.captionStyle === 'clean',
                'font-light text-gray-300 tracking-wider text-xs': ai.captionStyle === 'minimal',
              }"
            >
              Aperçu des sous-titres IA ({{ ai.language.toUpperCase() }})
            </p>
          </div>
        </div>
      </div>

      <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
            <Icon name="lucide:shield" class="w-4 h-4 text-[#7f13ec]" />
          </div>
          <h3 class="text-white font-semibold text-base">Sécurité</h3>
        </div>

        <div class="space-y-5">
          <div>
            <p class="text-gray-400 text-sm mb-3">Changer le mot de passe</p>
            <div class="space-y-3">
              <input
                v-model="security.currentPassword"
                type="password"
                placeholder="Mot de passe actuel"
                class="w-full bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7f13ec] transition-colors"
              />
              <input
                v-model="security.newPassword"
                type="password"
                placeholder="Nouveau mot de passe"
                class="w-full bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7f13ec] transition-colors"
              />
              <button
                @click="changePassword"
                class="text-[#7f13ec] text-sm hover:text-purple-400 transition-colors font-medium"
              >
                Mettre à jour le mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#191022] border-t border-[#7f13ec]/20 px-6 py-4 flex items-center justify-between z-10">
      <div class="flex gap-3">
        <button class="px-5 py-2 border border-[#7f13ec]/30 text-gray-300 hover:text-white rounded-lg text-sm transition-colors">
          Annuler
        </button>
        <button @click="saveAll" class="px-5 py-2 bg-[#7f13ec] hover:bg-[#9333ea] text-white rounded-lg text-sm font-medium transition-colors">
          Sauvegarder tout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

definePageMeta({
  layout: 'dashboard',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { subscription, currentPlanDetails, refreshSubscription, getAuthHeaders } = useSubscription()

const profile = ref({
  name: '',
  email: '',
})

const ai = ref({
  language: 'fr',
  captionStyle: 'bold',
  translationEnabled: false,
})

const isSavingAi = ref(false)
const aiSaveStatus = ref('') // 'saving' | 'saved' | ''

let autoSaveTimer = null

const autoSaveAiPreferences = () => {
  aiSaveStatus.value = 'saving'
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    try {
      await saveAiPreferences()
      aiSaveStatus.value = 'saved'
      setTimeout(() => { aiSaveStatus.value = '' }, 2000)
    } catch {
      aiSaveStatus.value = ''
    }
  }, 800)
}

const captionStyles = [
  { value: 'bold', label: 'BOLD' },
  { value: 'clean', label: 'Clean' },
  { value: 'minimal', label: 'Minimal' },
]

const security = ref({
  currentPassword: '',
  newPassword: '',
})

let unsubscribe = null

const getCurrentUser = async () => {
  if (auth.currentUser) return auth.currentUser
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (user) => {
      off()
      resolve(user)
    })
  })
}

const loadPreferences = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${apiBase}/video/preferences`, { headers })
    if (!response.ok) return
    const data = await response.json()
    ai.value.language = data.targetSubtitleLanguage || 'fr'
    ai.value.captionStyle = data.captionStyle || 'bold'
    ai.value.translationEnabled = Boolean(data.subtitleTranslationEnabled)
  } catch (error) {
    console.error('Erreur chargement préférences :', error)
  }
}

const toggleTranslation = () => {
  if (!subscription.value?.canTranslateSubtitles) {
    ai.value.translationEnabled = false
    alert('La traduction des sous-titres est réservée aux plans Starter et Pro.')
    return
  }

  ai.value.translationEnabled = !ai.value.translationEnabled
}

const saveProfile = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return

    if ((profile.value.name || '') !== (user.displayName || '')) {
      await updateProfile(user, { displayName: profile.value.name.trim() })
    }

    const nextEmail = profile.value.email.trim()
    if (nextEmail && nextEmail !== (user.email || '')) {
      await updateEmail(user, nextEmail)
    }

    alert('Profil mis à jour.')
  } catch (error) {
    console.error('Erreur profil :', error)
    alert('Impossible de sauvegarder le profil. Reconnecte-toi si nécessaire.')
  }
}

const saveAiPreferences = async () => {
  const headers = await getAuthHeaders()
  const response = await fetch(`${apiBase}/video/preferences`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subtitleTranslationEnabled: ai.value.translationEnabled,
      targetSubtitleLanguage: ai.value.language,
      captionStyle: ai.value.captionStyle,
    }),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la sauvegarde des préférences IA.')
  }
}

const changePassword = async () => {
  try {
    const user = await getCurrentUser()
    if (!user || !user.email) {
      alert('Utilisateur non connecté.')
      return
    }

    if (!security.value.currentPassword || !security.value.newPassword) {
      alert('Renseigne le mot de passe actuel et le nouveau mot de passe.')
      return
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      security.value.currentPassword,
    )
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, security.value.newPassword)

    security.value.currentPassword = ''
    security.value.newPassword = ''
    alert('Mot de passe mis à jour.')
  } catch (error) {
    console.error('Erreur mot de passe :', error)
    alert('Impossible de modifier le mot de passe. Reconnecte-toi et réessaie.')
  }
}

const saveAll = async () => {
  try {
    await saveProfile()
    await saveAiPreferences()
    await refreshSubscription()
    await loadPreferences()
    alert('Paramètres sauvegardés.')
  } catch (error) {
    console.error('Erreur sauvegarde globale :', error)
    alert('Erreur lors de la sauvegarde des paramètres.')
  }
}

onMounted(async () => {
  unsubscribe = onAuthStateChanged(auth, (user) => {
    profile.value.name = user?.displayName || ''
    profile.value.email = user?.email || ''
  })
  await refreshSubscription()
  await loadPreferences()

  // Auto-save dès que l'utilisateur change une préférence IA
  watch(
    () => ({ ...ai.value }),
    () => { autoSaveAiPreferences() },
    { deep: true },
  )
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>
