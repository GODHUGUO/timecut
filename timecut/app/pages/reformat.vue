<template>
  <div>
    <div class="flex flex-col items-center justify-center min-h-full py-10">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Reformater une vidéo</h1>
        <p class="text-white text-sm mt-2">Transformez une vidéo horizontale en format vertical (9:16), sans la découper.</p>
      </div>

      <!-- Réservé aux abonnés payants -->
      <div v-if="subscription && !isPaidUser" class="w-full max-w-lg">
        <div class="bg-[#1e1333] border border-[#7f13ec]/30 rounded-2xl p-8 text-center">
          <div class="w-12 h-12 rounded-xl bg-[#7f13ec]/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:lock" class="w-6 h-6 text-[#7f13ec]" />
          </div>
          <h3 class="text-white font-bold text-lg">Fonctionnalité réservée aux abonnés</h3>
          <p class="text-gray-400 text-sm mt-2">
            Le reformatage de vidéo est disponible avec les plans <span class="text-white font-semibold">Starter</span> et <span class="text-white font-semibold">Pro</span>.
          </p>
          <NuxtLink
            to="/billing"
            class="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Icon name="lucide:sparkles" class="w-4 h-4" />
            Voir les offres
          </NuxtLink>
        </div>
      </div>

      <!-- Formulaire de reformatage -->
      <div v-else class="w-full max-w-lg space-y-4">
        <div
          class="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer"
          :class="isDragging
            ? 'border-[#7f13ec] bg-[#7f13ec]/10'
            : 'border-[#7f13ec]/30 bg-[#1e1333] hover:border-[#7f13ec]/60 hover:bg-[#7f13ec]/5'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <div class="w-12 h-12 rounded-full bg-[#7f13ec]/20 flex items-center justify-center">
            <Icon name="lucide:upload-cloud" class="w-6 h-6 text-[#7f13ec]" />
          </div>
          <div class="text-center">
            <p class="text-white font-semibold text-sm">
              {{ uploadedFile ? uploadedFile.name : 'Glissez-déposez votre vidéo' }}
            </p>
            <p class="text-gray-500 text-xs mt-1">Formats acceptés : MP4, MOV, AVI, MKV, WebM, WMV, FLV, 3GP (max. 99 Mo)</p>
          </div>
          <button
            class="px-5 py-2 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-medium rounded-lg transition-colors"
            @click.stop="triggerFileInput"
          >
            Parcourir les fichiers
          </button>
          <input ref="fileInput" type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/x-ms-wmv,video/x-flv,video/3gpp" class="hidden" @change="handleFileChange" />
        </div>

        <div>
          <label class="block text-white text-sm mb-3">Format de sortie</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="opt in formatOptions"
              :key="opt.value"
              @click="format = opt.value"
              class="flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left"
              :class="format === opt.value
                ? 'border-[#7f13ec] bg-[#7f13ec]/10'
                : 'border-[#7f13ec]/20 bg-[#1e1333] hover:border-[#7f13ec]/40'"
            >
              <div class="flex items-center justify-between w-full">
                <div class="w-8 h-8 rounded-lg bg-[#2a1a44] flex items-center justify-center">
                  <Icon :name="opt.icon" class="w-4 h-4 text-[#7f13ec]" />
                </div>
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="format === opt.value ? 'border-[#7f13ec]' : 'border-gray-600'">
                  <div v-if="format === opt.value" class="w-2 h-2 rounded-full bg-[#7f13ec]" />
                </div>
              </div>
              <div>
                <p class="text-white text-sm font-medium">{{ opt.label }}</p>
                <p class="text-gray-500 text-xs mt-0.5">{{ opt.hint }}</p>
              </div>
            </button>
          </div>
        </div>

        <button
          @click="startReformat"
          :disabled="isProcessing || !uploadedFile"
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
          :class="isProcessing || !uploadedFile
            ? 'bg-[#7f13ec]/40 cursor-not-allowed'
            : 'bg-[#7f13ec] hover:opacity-90 shadow-lg'"
        >
          <Icon name="lucide:crop" class="w-4 h-4" />
          <span v-if="isProcessing">Traitement en cours...</span>
          <span v-else>Reformater la vidéo</span>
        </button>

        <div v-if="isProcessing" class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-white">
              <span class="w-2 h-2 rounded-full bg-[#7f13ec] animate-pulse inline-block" />
              {{ progressLabel || 'Traitement en cours...' }}
            </div>
            <span class="text-[#7f13ec] font-semibold">{{ progress }}%</span>
          </div>
          <div class="w-full h-1.5 bg-[#2a1a44] rounded-full overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-[#7f13ec] to-[#a855f7] rounded-full transition-all duration-500"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>
      </div>

      <p class="text-gray-600 text-xs mt-12">© {{ year }} TimeCut. Tous droits réservés.</p>
    </div>

    <!-- Modal résultat -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);"
          @click.self="showModal = false"
        >
          <div class="bg-[#12082a] border border-[#7f13ec]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#7f13ec]/20">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
                  <Icon name="lucide:check-circle" class="w-4 h-4 text-[#7f13ec]" />
                </div>
                <h2 class="text-white font-semibold text-sm">Vidéo reformatée avec succès</h2>
              </div>
              <button @click="showModal = false" class="text-gray-500 hover:text-white transition-colors">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 py-5">
              <video
                v-if="resultUrl"
                :src="resultUrl"
                controls
                class="w-full max-h-72 rounded-xl bg-black mb-4"
              />
              <button
                @click="downloadResult"
                :disabled="isDownloading"
                class="w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
                :class="isDownloading ? 'bg-[#7f13ec]/50' : 'bg-[#7f13ec] hover:bg-[#9333ea]'"
              >
                <div v-if="isDownloading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <Icon v-else name="lucide:download-cloud" class="w-4 h-4" />
                <span>{{ isDownloading ? 'Téléchargement...' : 'Télécharger la vidéo' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Popup Waitlist (fichier trop volumineux) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showWaitlistModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);"
          @click.self="showWaitlistModal = false"
        >
          <div class="bg-[#12082a] border border-[#7f13ec]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div class="px-6 pt-6 pb-4">
              <div class="w-12 h-12 rounded-xl bg-[#7f13ec]/20 flex items-center justify-center mb-4">
                <Icon name="lucide:clock" class="w-6 h-6 text-[#7f13ec]" />
              </div>
              <h3 class="text-white font-bold text-lg">Fichier trop volumineux</h3>
              <p class="text-gray-400 text-sm mt-2">
                Les vidéos de plus de <span class="text-white font-semibold">100 Mo</span> ne sont pas encore disponibles.
              </p>
            </div>
            <div class="px-6 pb-6">
              <button
                @click="showWaitlistModal = false"
                class="w-full py-2.5 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'dashboard' })

const year = new Date().getFullYear()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { subscription, refreshSubscription, getAuthHeaders } = useSubscription()
const { showPopup } = usePopup()

const fileInput = ref(null)
const uploadedFile = ref(null)
const isDragging = ref(false)
const format = ref('vertical_blur')

const isProcessing = ref(false)
const progress = ref(0)
const progressLabel = ref('')
const resultUrl = ref('')
const showModal = ref(false)
const isDownloading = ref(false)
const showWaitlistModal = ref(false)

const formatOptions = [
  {
    value: 'vertical_blur',
    label: 'Vertical — fond flou',
    hint: 'Image entière sur fond flou',
    icon: 'lucide:smartphone',
  },
  {
    value: 'vertical_crop',
    label: 'Vertical — recadré',
    hint: 'Plein cadre (bords coupés)',
    icon: 'lucide:smartphone',
  },
]

const isPaidUser = computed(() => {
  const plan = subscription.value?.currentPlan
  return plan === 'starter' || plan === 'pro'
})

const triggerFileInput = () => fileInput.value?.click()

const loadFile = (file) => {
  if (!file) return
  if (file.size > 99 * 1024 * 1024) {
    showWaitlistModal.value = true
    return
  }
  uploadedFile.value = file
}

const handleFileChange = (event) => loadFile(event.target.files[0])
const handleDrop = (event) => {
  isDragging.value = false
  loadFile(event.dataTransfer.files[0])
}

const uploadToCloudinary = (cloudName, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(event.loaded / event.total)
      }
    }

    xhr.onload = () => {
      let data = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // réponse non-JSON
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
      } else {
        reject(new Error(data?.error?.message || 'Erreur upload Cloudinary'))
      }
    }

    xhr.onerror = () => reject(new Error('Erreur réseau pendant le téléversement'))
    xhr.send(formData)
  })
}

const startReformat = async () => {
  if (isProcessing.value) return
  if (!uploadedFile.value) {
    showPopup('Veuillez sélectionner une vidéo avant de continuer.', 'warning')
    return
  }
  if (!isPaidUser.value) {
    showPopup('Cette fonctionnalité est réservée aux abonnements Starter et Pro.', 'warning')
    return
  }

  isProcessing.value = true
  progress.value = 0
  progressLabel.value = 'Préparation...'
  resultUrl.value = ''
  showModal.value = false

  let processInterval = null

  try {
    const headers = await getAuthHeaders()

    // Étape 1 : signature Cloudinary
    const signRes = await $fetch(`${apiBase}/video/sign-upload`, { headers })
    const { signature, timestamp, cloudName, apiKey, folder } = signRes

    // Étape 2 : upload direct sur Cloudinary (0 → 50 %)
    progressLabel.value = 'Téléversement de la vidéo...'
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    formData.append('signature', signature)
    formData.append('timestamp', String(timestamp))
    formData.append('api_key', apiKey)
    formData.append('folder', folder)

    const cloudData = await uploadToCloudinary(cloudName, formData, (ratio) => {
      progress.value = Math.min(50, Math.round(ratio * 50))
    })
    progress.value = 50

    // Étape 3 : reformatage côté backend (50 → 95 % en animation)
    progressLabel.value = 'Reformatage de la vidéo en cours...'
    processInterval = setInterval(() => {
      if (progress.value < 95) {
        progress.value += Math.max(1, Math.round((95 - progress.value) * 0.04))
      }
    }, 600)

    const freshHeaders = await getAuthHeaders()
    const res = await fetch(`${apiBase}/video/reformat`, {
      method: 'POST',
      headers: { ...freshHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicId: cloudData.public_id,
        duration: cloudData.duration,
        filename: uploadedFile.value.name,
        format: format.value,
      }),
    })

    clearInterval(processInterval)
    processInterval = null

    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Erreur lors du reformatage')

    resultUrl.value = data.url || ''
    progressLabel.value = 'Finalisation...'
    progress.value = 100

    setTimeout(async () => {
      isProcessing.value = false
      progress.value = 0
      progressLabel.value = ''
      showModal.value = true
      await refreshSubscription()
    }, 800)
  } catch (error) {
    console.error('Erreur reformatage :', error)
    showPopup(error.message || 'Erreur lors du reformatage', 'error')
    if (processInterval) clearInterval(processInterval)
    isProcessing.value = false
    progress.value = 0
    progressLabel.value = ''
  }
}

const downloadResult = async () => {
  if (isDownloading.value || !resultUrl.value) return
  isDownloading.value = true
  try {
    const downloadUrl = resultUrl.value.replace('/upload/', '/upload/fl_attachment/')
    const response = await fetch(downloadUrl)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = 'video_reformatee.mp4'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Erreur téléchargement :', error)
    showPopup('Erreur lors du téléchargement.', 'error')
  } finally {
    isDownloading.value = false
  }
}

onMounted(async () => {
  try {
    await refreshSubscription()
  } catch (error) {
    console.error('Erreur chargement abonnement :', error)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
