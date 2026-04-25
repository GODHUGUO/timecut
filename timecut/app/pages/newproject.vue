<template>
  <div>
    <div class="flex flex-col items-center justify-center min-h-full py-10">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Transformer vos vidéos</h1>
        <p class="text-white text-sm mt-2">Générez des clips courts optimisés par l'IA en quelques secondes.</p>
      </div>

      <div v-if="subscription" class="w-full max-w-lg mb-4">
        <div class="flex items-center justify-between bg-[#7f13ec]/10 border border-[#7f13ec]/30 rounded-xl px-4 py-3">
          <div class="flex items-center gap-2">
            <Icon name="lucide:info" class="w-4 h-4 text-[#7f13ec] shrink-0" />
            <p class="text-gray-300 text-xs">
              Plan {{ currentPlanDetails.name }} :
              <span class="text-white font-semibold">{{ subscription.minutesRemaining }} min</span> restante(s) sur
              <span class="text-white font-semibold">{{ subscription.minutesIncluded }} min</span> ce mois.
            </p>
          </div>
          <NuxtLink to="/billing" class="shrink-0 ml-3 px-3 py-1.5 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-xs font-medium rounded-lg transition-colors">
            Voir les offres
          </NuxtLink>
        </div>
      </div>

      <div class="w-full max-w-lg space-y-4">
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
            <p class="text-gray-500 text-xs mt-1">Formats acceptés : MP4, MOV (max. 99 Mo)</p>
          </div>
          <button
            class="px-5 py-2 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-medium rounded-lg transition-colors"
            @click.stop="triggerFileInput"
          >
            Parcourir les fichiers
          </button>
          <input ref="fileInput" type="file" accept="video/mp4,video/quicktime" class="hidden" @change="handleFileChange" />
        </div>

        <div>
          <label class="block text-white text-sm mb-2">Durée de chaque clip (en secondes)</label>
          <input
            v-model="clipDuration"
            type="number"
            min="1"
            placeholder="Ex. 60, 120, 300..."
            class="w-full bg-[#1e1333] border border-[#7f13ec]/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7f13ec] transition-colors"
          />
          <div class="mt-3 bg-[#1e1333] border border-[#7f13ec]/10 rounded-xl p-4">
            <p class="text-white text-xs mb-2">Convertisseur : entrez les minutes pour obtenir les secondes</p>
            <div class="flex items-center gap-3">
              <input
                v-model="minutesInput"
                type="number"
                min="1"
                placeholder="Ex. 1, 2, 5..."
                class="w-full bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7f13ec] transition-colors"
              />
              <span class="text-white text-sm shrink-0">min =</span>
              <span class="text-[#7f13ec] font-bold text-sm shrink-0 w-16">
                {{ minutesInput ? minutesInput * 60 : '—' }} sec
              </span>
              <button
                v-if="minutesInput"
                @click="clipDuration = String(minutesInput * 60)"
                class="shrink-0 px-3 py-2 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Utiliser
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-white text-sm mb-3">Sous-titres IA</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="subtitleMode = 'none'"
              class="flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left"
              :class="subtitleMode === 'none'
                ? 'border-[#7f13ec] bg-[#7f13ec]/10'
                : 'border-[#7f13ec]/20 bg-[#1e1333] hover:border-[#7f13ec]/40'"
            >
              <div class="flex items-center justify-between w-full">
                <div class="w-8 h-8 rounded-lg bg-[#2a1a44] flex items-center justify-center">
                  <Icon name="lucide:captions-off" class="w-4 h-4 text-white" />
                </div>
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="subtitleMode === 'none' ? 'border-[#7f13ec]' : 'border-gray-600'">
                  <div v-if="subtitleMode === 'none'" class="w-2 h-2 rounded-full bg-[#7f13ec]" />
                </div>
              </div>
              <div>
                <p class="text-white text-sm font-medium">Sans sous-titres</p>
                <p class="text-gray-500 text-xs mt-0.5">Export vidéo brut</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Inclus</span>
            </button>

            <button
              @click="handleSubtitleSelect"
              class="flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left"
              :class="subtitleMode === 'ai'
                ? 'border-[#7f13ec] bg-[#7f13ec]/10'
                : subscription && !subscription.canUseAiSubtitles
                  ? 'border-[#7f13ec]/10 bg-[#1e1333] opacity-50 cursor-not-allowed'
                  : 'border-[#7f13ec]/20 bg-[#1e1333] hover:border-[#7f13ec]/40'"
            >
              <div class="flex items-center justify-between w-full">
                <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
                  <Icon name="lucide:sparkles" class="w-4 h-4 text-[#7f13ec]" />
                </div>
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="subtitleMode === 'ai' ? 'border-[#7f13ec]' : 'border-gray-600'">
                  <div v-if="subtitleMode === 'ai'" class="w-2 h-2 rounded-full bg-[#7f13ec]" />
                </div>
              </div>
              <div>
                <p class="text-white text-sm font-medium">Sous-titres IA</p>
                <p class="text-gray-500 text-xs mt-0.5">Générés automatiquement</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-[#7f13ec]/10 text-[#7f13ec] border border-[#7f13ec]/30">
                {{ subscription && !subscription.canUseAiSubtitles ? 'Starter ou Pro' : 'Inclus' }}
              </span>
            </button>
          </div>
          <p v-if="subscription && !subscription.canUseAiSubtitles" class="text-amber-300 text-xs mt-3">
            Les sous-titres IA sont disponibles uniquement avec les plans Starter et Pro.
          </p>
        </div>

        <!-- <button
          @click="startProcessing"
          :disabled="isProcessing || !uploadedFile || !hasEnoughMinutes"
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
          :class="isProcessing || !uploadedFile || !hasEnoughMinutes
            ? 'bg-[#7f13ec]/40 cursor-not-allowed'
            : 'bg-[#7f13ec] hover:opacity-90 shadow-lg'"
        >
          <Icon name="lucide:zap" class="w-4 h-4" />
          <span v-if="!hasEnoughMinutes">Quota insuffisant — voir la facturation</span>
          <span v-else-if="isProcessing">Traitement en cours...</span>
          <span v-else>Générer la vidéo</span>
        </button> -->

  <button
          @click="startProcessing"
          :disabled="isProcessing || !uploadedFile"
          class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
          :class="isProcessing || !uploadedFile 
            ? 'bg-[#7f13ec]/40 cursor-not-allowed'
            : 'bg-[#7f13ec] hover:opacity-90 shadow-lg'"
        >
          <Icon name="lucide:zap" class="w-4 h-4" />
          <!-- <span v-if="!hasEnoughMinutes">Quota insuffisant — voir la facturation</span> -->
          <span v-if="isProcessing">Traitement en cours...</span>
          <span v-else>Générer la vidéo</span>
        </button>


        <p v-if="uploadedFile && requiredMinutes > 0" class="text-gray-400 text-xs text-center">
          Cette vidéo consommera {{ requiredMinutes }} min de quota.
        </p>

        <div v-if="isProcessing" class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-white">
              <span class="w-2 h-2 rounded-full bg-[#7f13ec] animate-pulse inline-block" />
              Traitement en cours...
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

      <div class="flex items-center justify-center gap-10 mt-12">
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-[#1e1333] border border-[#7f13ec]/20 flex items-center justify-center">
            <Icon name="lucide:monitor" class="w-5 h-5 text-[#7f13ec]" />
          </div>
          <span class="text-white text-xs">Full HD</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-[#1e1333] border border-[#7f13ec]/20 flex items-center justify-center">
            <Icon name="lucide:sparkles" class="w-5 h-5 text-[#7f13ec]" />
          </div>
          <span class="text-white text-xs">Sous-titres IA</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-[#1e1333] border border-[#7f13ec]/20 flex items-center justify-center">
            <Icon name="lucide:rocket" class="w-5 h-5 text-[#7f13ec]" />
          </div>
          <span class="text-white text-xs">Export rapide</span>
        </div>
      </div>

      <p class="text-gray-600 text-xs mt-12">© {{ year }} TimeCut. Tous droits réservés.</p>
    </div>

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
                <h2 class="text-white font-semibold text-sm">
                  {{ clipUrls.length }} clip(s) généré(s) avec succès
                </h2>
              </div>
              <button @click="showModal = false" class="text-gray-500 hover:text-white transition-colors">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 py-4 space-y-3 max-h-72 overflow-y-auto">
              <div
                v-for="(url, index) in clipUrls"
                :key="index"
                class="flex items-center gap-3 bg-[#1e1333] border border-[#7f13ec]/10 rounded-xl px-4 py-3"
              >
                <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center shrink-0">
                  <Icon name="lucide:film" class="w-4 h-4 text-[#7f13ec]" />
                </div>
                <div>
                  <p class="text-white text-sm font-medium">Clip {{ index + 1 }}</p>
                  <p class="text-gray-500 text-xs">MP4 • Prêt</p>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-[#7f13ec]/20">
              <button
                @click="downloadAll"
                class="w-full flex items-center justify-center gap-2 py-3.5 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Icon name="lucide:download-cloud" class="w-4 h-4" />
                Télécharger tous les clips ({{ clipUrls.length }})
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showValidationModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);"
          @click.self="showValidationModal = false"
        >
          <div class="bg-[#12082a] border border-[#7f13ec]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div class="flex items-start gap-3 px-6 py-5">
              <div class="w-9 h-9 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center shrink-0">
                <Icon name="lucide:shield-alert" class="w-5 h-5 text-[#7f13ec]" />
              </div>
              <div class="flex-1">
                <h3 class="text-white font-semibold text-sm">Durée invalide</h3>
                <p class="text-gray-300 text-sm mt-1">{{ validationMessage }}</p>
              </div>
            </div>
            <div class="px-6 pb-5">
              <button
                @click="showValidationModal = false"
                class="w-full py-3 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Compris
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
const { subscription, currentPlanDetails, refreshSubscription, getAuthHeaders } = useSubscription()

const fileInput = ref(null)
const uploadedFile = ref(null)
const videoDurationSeconds = ref(0)
const clipDuration = ref('')
const minutesInput = ref('')
const isDragging = ref(false)
const subtitleMode = ref('none')

const isProcessing = ref(false)
const progress = ref(0)
const clipUrls = ref([])
const showModal = ref(false)
const showValidationModal = ref(false)
const validationMessage = ref('')

const requiredMinutes = computed(() => {
  if (!videoDurationSeconds.value) return 0
  return Math.max(Math.ceil(videoDurationSeconds.value / 60), 1)
})

const hasEnoughMinutes = computed(() => {
  if (!subscription.value || !uploadedFile.value) return false
  return subscription.value.minutesRemaining >= requiredMinutes.value && subscription.value.minutesRemaining > 0
})

const triggerFileInput = () => fileInput.value?.click()

const getFileDurationInSeconds = (file) => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Number(video.duration) || 0
      URL.revokeObjectURL(objectUrl)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Impossible de lire la durée de la vidéo.'))
    }
    video.src = objectUrl
  })
}

const validateClipDuration = () => {
  const duration = Number(clipDuration.value)

  if (!Number.isFinite(duration) || duration <= 0) {
    validationMessage.value = 'Veuillez entrer une durée de clip valide (en secondes).'
    showValidationModal.value = true
    return false
  }

  if (videoDurationSeconds.value > 0 && duration > videoDurationSeconds.value) {
    validationMessage.value = `Impossible : la durée du clip (${duration}s) ne peut pas dépasser la durée totale de la vidéo (${Math.floor(videoDurationSeconds.value)}s).`
    showValidationModal.value = true
    return false
  }

  return true
}

const loadFile = async (file) => {
  if (!file) return
  if (file.size > 99 * 1024 * 1024) {
    alert('Fichier trop volumineux. Maximum 99 Mo.')
    return
  }

  try {
    videoDurationSeconds.value = await getFileDurationInSeconds(file)
  } catch (error) {
    console.error(error)
    alert('Impossible de lire la durée de cette vidéo.')
    return
  }

  uploadedFile.value = file
}

const handleFileChange = async (event) => {
  await loadFile(event.target.files[0])
}

const handleDrop = async (event) => {
  isDragging.value = false
  await loadFile(event.dataTransfer.files[0])
}

const handleSubtitleSelect = () => {
  if (!subscription.value?.canUseAiSubtitles) return
  subtitleMode.value = 'ai'
}

const downloadAll = async () => {
  for (let index = 0; index < clipUrls.value.length; index += 1) {
    const url = clipUrls.value[index]
    const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/')

    const response = await fetch(downloadUrl)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `clip_${index + 1}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)

    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

const startProcessing = async () => {
  if (isProcessing.value) return
  if (!uploadedFile.value) {
    alert('Veuillez sélectionner une vidéo avant de continuer.')
    return
  }
  if (!hasEnoughMinutes.value) {
    alert('Votre quota mensuel est insuffisant pour traiter cette vidéo.')
    return
  }
  if (!validateClipDuration()) return

  isProcessing.value = true
  progress.value = 0
  clipUrls.value = []
  showModal.value = false

  const formData = new FormData()
  formData.append('file', uploadedFile.value)
  formData.append('clipDuration', clipDuration.value)
  formData.append('subtitleMode', subtitleMode.value)

  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${apiBase}/video/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.message || "Erreur lors de l'envoi")
    }

    clipUrls.value = data.clips || []

    const interval = setInterval(() => {
      progress.value += Math.floor(Math.random() * 8) + 2
      if (progress.value >= 100) {
        progress.value = 100
        clearInterval(interval)
        setTimeout(async () => {
          isProcessing.value = false
          progress.value = 0
          showModal.value = true
          await refreshSubscription()
        }, 1000)
      }
    }, 400)
  } catch (error) {
    console.error('Erreur upload :', error)
    alert(error.message || "Erreur lors de l'envoi")
    isProcessing.value = false
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
