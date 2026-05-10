<template>
  <Teleport to="body">
    <div class="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
      <TransitionGroup name="popup">
        <div
          v-for="popup in popups"
          :key="popup.id"
          class="pointer-events-auto overflow-hidden rounded-xl border bg-[#12082a]/95 shadow-2xl backdrop-blur"
          :class="popupStyles[popup.type].container"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3 px-4 py-3.5">
            <div
              class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="popupStyles[popup.type].iconBox"
            >
              <Icon :name="popupStyles[popup.type].icon" class="h-5 w-5" :class="popupStyles[popup.type].iconColor" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-white">
                {{ popup.title || popupStyles[popup.type].title }}
              </p>
              <p class="mt-1 text-sm leading-relaxed text-gray-300">
                {{ popup.message }}
              </p>
            </div>

            <button
              type="button"
              class="rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer la notification"
              @click="removePopup(popup.id)"
            >
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { popups, removePopup } = usePopup()

const popupStyles = {
  success: {
    title: 'Succes',
    icon: 'lucide:check-circle',
    container: 'border-green-500/30',
    iconBox: 'bg-green-500/10',
    iconColor: 'text-green-400',
  },
  error: {
    title: 'Erreur',
    icon: 'lucide:alert-triangle',
    container: 'border-red-500/30',
    iconBox: 'bg-red-500/10',
    iconColor: 'text-red-400',
  },
  warning: {
    title: 'Attention',
    icon: 'lucide:shield-alert',
    container: 'border-amber-500/30',
    iconBox: 'bg-amber-500/10',
    iconColor: 'text-amber-300',
  },
  info: {
    title: 'Information',
    icon: 'lucide:info',
    container: 'border-[#7f13ec]/30',
    iconBox: 'bg-[#7f13ec]/20',
    iconColor: 'text-[#7f13ec]',
  },
} as const
</script>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
