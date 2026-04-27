<template>
  <div class="space-y-6 pb-10">
    <div>
      <h1 class="text-2xl font-bold text-white">Mes projets</h1>
      <p class="text-gray-400 text-sm mt-1">Les dernières vidéos découpées apparaissent ici.</p>
    </div>

    <div v-if="pending" class="py-16 text-center text-gray-400 text-sm">
      Chargement des projets...
    </div>

    <div v-else-if="error" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm">
      Impossible de charger les projets.
    </div>

    <div
      v-else-if="!currentProject"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-[#1e1333] border border-[#7f13ec]/20 flex items-center justify-center mx-auto mb-4">
        <Icon name="lucide:video-off" class="w-7 h-7 text-[#7f13ec]/40" />
      </div>
      <p class="text-white font-semibold text-lg">Aucun projet disponible</p>
      <p class="text-gray-500 text-sm mt-2 max-w-xs">
        Uploade une vidéo depuis la page de création pour voir les derniers clips ici.
      </p>
      <NuxtLink
        to="/newproject"
        class="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-medium rounded-xl transition-colors"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        Nouvelle vidéo
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl overflow-hidden">
        <div class="p-5 border-b border-[#7f13ec]/10">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-white font-semibold">{{ currentProject.filename }}</h3>
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <div class="flex items-center gap-1.5">
                  <Icon name="lucide:calendar" class="w-3.5 h-3.5" />
                  Créé le {{ formatDate(currentProject.createdAt) }}
                </div>
                <div class="flex items-center gap-1.5 text-[#7f13ec]">
                  <Icon name="lucide:scissors-line-dashed" class="w-3.5 h-3.5" />
                  {{ currentProject.clips.length }} clip(s)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5">
          <p class="text-xs text-gray-400 mb-4">Clips découpés générés</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(clip, index) in currentProject.clips"
              :key="clip.id"
              class="rounded-2xl border border-[#7f13ec]/10 bg-[#140b28] p-3"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p class="text-white text-xs font-semibold">Clip {{ index + 1 }}</p>
                  <p class="text-gray-500 text-xs">{{ formatDuration(clip.duration) }}</p>
                </div>
                <a
                  :href="clip.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-[11px] font-medium rounded-lg transition-colors"
                >
                  <Icon name="lucide:external-link" class="w-3 h-3" />
                  Ouvrir
                </a>
              </div>

              <video
                :src="clip.url"
                controls
                class="w-full aspect-9/16 max-h-56 object-cover rounded-xl bg-black"
                preload="metadata"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

definePageMeta({
  layout: 'dashboard',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const getCurrentUser = async () => {
  if (auth.currentUser) return auth.currentUser

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

const user = await getCurrentUser()
const authHeaders = user
  ? {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'x-user-id': user.uid,
    }
  : undefined

const { data, pending, error } = await useFetch(`${apiBase}/video/projects`, {
  headers: authHeaders,
  default: () => [],
})

const currentProject = computed(() => data.value?.[0] ?? null)

const formatDate = (value) => {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (seconds) => {
  const totalSeconds = Math.round(Number(seconds) || 0)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}
</script>
