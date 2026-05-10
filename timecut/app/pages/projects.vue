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
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-white font-semibold">{{ currentProject.filename }}</h3>
              <div class="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
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
            <button
              v-if="currentProject.clips.length"
              type="button"
              :disabled="isDownloadingAll"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#7f13ec] hover:bg-[#9333ea] disabled:bg-[#7f13ec]/40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors"
              @click="downloadProjectClips"
            >
              <Icon :name="isDownloadingAll ? 'lucide:loader-circle' : 'lucide:download-cloud'" class="w-4 h-4" :class="{ 'animate-spin': isDownloadingAll }" />
              {{ isDownloadingAll ? 'Téléchargement...' : 'Télécharger tout' }}
            </button>
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
              <div class="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p class="text-white text-xs font-semibold">Clip {{ index + 1 }}</p>
                  <p class="text-gray-500 text-xs">{{ formatDuration(clip.duration) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    :disabled="isClipDownloading(clip)"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#7f13ec] text-white transition-colors hover:bg-[#9333ea] disabled:bg-[#7f13ec]/40 disabled:cursor-not-allowed"
                    title="Télécharger le clip"
                    aria-label="Télécharger le clip"
                    @click="downloadClip(clip, index)"
                  >
                    <Icon :name="isClipDownloading(clip) ? 'lucide:loader-circle' : 'lucide:download'" class="w-3.5 h-3.5" :class="{ 'animate-spin': isClipDownloading(clip) }" />
                  </button>
                  <a
                    :href="clip.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#7f13ec]/20 bg-[#1e1333] text-gray-300 transition-colors hover:text-white hover:bg-[#7f13ec]/10"
                    title="Ouvrir le clip"
                    aria-label="Ouvrir le clip"
                  >
                    <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
                  </a>
                </div>
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
import { computed, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

definePageMeta({
  layout: 'dashboard',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { showPopup } = usePopup()
const downloadingClipIds = ref([])
const isDownloadingAll = ref(false)

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

const getClipKey = (clip) => String(clip.id || clip.url)

const isClipDownloading = (clip) => {
  return downloadingClipIds.value.includes(getClipKey(clip))
}

const getDownloadUrl = (url) => {
  if (!url) return ''
  if (url.includes('/upload/fl_attachment/')) return url
  return url.replace('/upload/', '/upload/fl_attachment/')
}

const sanitizeFilename = (value) => {
  return String(value || 'video')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'video'
}

const triggerBlobDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}

const downloadClipFile = async (clip, index) => {
  const downloadUrl = getDownloadUrl(clip.url)
  if (!downloadUrl) {
    throw new Error('URL du clip introuvable.')
  }

  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error('Impossible de télécharger ce clip.')
  }

  const blob = await response.blob()
  const projectName = sanitizeFilename(currentProject.value?.filename)
  triggerBlobDownload(blob, `${projectName}_clip_${index + 1}.mp4`)
}

const downloadClip = async (clip, index) => {
  const clipKey = getClipKey(clip)
  if (downloadingClipIds.value.includes(clipKey)) return

  downloadingClipIds.value = [...downloadingClipIds.value, clipKey]

  try {
    await downloadClipFile(clip, index)
    showPopup(`Clip ${index + 1} téléchargé.`, 'success')
  } catch (error) {
    console.error('Erreur telechargement clip :', error)
    showPopup(error.message || 'Impossible de télécharger le clip.', 'error')
  } finally {
    downloadingClipIds.value = downloadingClipIds.value.filter((id) => id !== clipKey)
  }
}

const downloadProjectClips = async () => {
  if (!currentProject.value?.clips?.length || isDownloadingAll.value) return

  isDownloadingAll.value = true

  try {
    for (let index = 0; index < currentProject.value.clips.length; index += 1) {
      await downloadClipFile(currentProject.value.clips[index], index)
      if (index < currentProject.value.clips.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }

    showPopup('Tous les clips ont été lancés en téléchargement.', 'success')
  } catch (error) {
    console.error('Erreur telechargement projet :', error)
    showPopup(error.message || 'Impossible de télécharger tous les clips.', 'error')
  } finally {
    isDownloadingAll.value = false
  }
}

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
