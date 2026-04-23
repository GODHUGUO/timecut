<template>
  <div class="h-screen bg-[#191022] flex overflow-hidden">
    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-50 w-64 bg-[#191022]  text-white shadow-xl border-r border-[#7f13ec]/20 transition-transform duration-300 ease-in-out lg:translate-x-0 -translate-x-full flex flex-col h-screen"
      :class="{ 'translate-x-0': isMobileMenuOpen }"
    >
      <!-- Logo -->
      <div class="shrink-0 mt-6 px-4 py-2 flex items-center justify-center">
        <div class="text-2xl font-bold">
          <span class="text-white">Time</span><span class="text-[#7f13ec]">Cut</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <NuxtLink
          to="/newproject"
          @click="closeMobileMenu"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
          :class="{
            'bg-[#7f13ec] text-white': $route.path === '/new-project',
            'text-white hover:text-white hover:bg-[#7f13ec]/20': $route.path !== '/new-project',
          }"
        >
          <Icon name="lucide:layout-dashboard" class="w-5 h-5 mr-3" :class="{ 'text-white': $route.path === '/new-project', 'text-[#7f13ec]': $route.path !== '/new-project' }" />
          <span>Nouveau projet</span>
        </NuxtLink>

        <NuxtLink
          to="/projects"
          @click="closeMobileMenu"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
          :class="{
            'bg-[#7f13ec] text-white': $route.path === '/projects',
            'text-white hover:text-white hover:bg-[#7f13ec]/20': $route.path !== '/projects',
          }"
        >
          <Icon name="lucide:folder" class="w-5 h-5 mr-3" :class="{ 'text-white': $route.path === '/projects', 'text-[#7f13ec]': $route.path !== '/projects' }" />
          <span>Mes projets</span>
        </NuxtLink>

        <NuxtLink
          to="/billing"
          @click="closeMobileMenu"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
          :class="{
            'bg-[#7f13ec] text-white': $route.path === '/billing',
            'text-white hover:text-white hover:bg-[#7f13ec]/20': $route.path !== '/billing',
          }"
        >
          <Icon name="lucide:credit-card" class="w-5 h-5 mr-3" :class="{ 'text-white': $route.path === '/billing', 'text-[#7f13ec]': $route.path !== '/billing' }" />
          <span>Facturation</span>
        </NuxtLink>

        <NuxtLink
          to="/settings"
          @click="closeMobileMenu"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
          :class="{
            'bg-[#7f13ec] text-white': $route.path === '/settings',
            'text-white hover:text-white hover:bg-[#7f13ec]/20': $route.path !== '/settings',
          }"
        >
          <Icon name="lucide:settings" class="w-5 h-5 mr-3" :class="{ 'text-white': $route.path === '/settings', 'text-[#7f13ec]': $route.path !== '/settings' }" />
          <span>Paramètres</span>
        </NuxtLink>
      </nav>

      <!-- User info -->
      <div class="shrink-0 p-4 border-t border-[#7f13ec]/20">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full bg-[#7f13ec]/30 flex items-center justify-center shrink-0">
            <Icon name="lucide:user" class="w-4 h-4 text-[#7f13ec]" />
          </div>
          <div class="ml-3 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ currentUser?.displayName || 'Utilisateur' }}</p>
            <p class="text-xs text-gray-400 truncate">{{ currentUser?.email || '' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay mobile -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="closeMobileMenu"
    />

    <!-- Main content -->
    <div class="lg:ml-64 flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Top bar -->
      <header class="shrink-0 bg-[#191022] border-b border-[#7f13ec]/20 shadow-sm z-20">
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center">
            <button
              @click="toggleMobileMenu"
              class="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[#7f13ec]/10 transition-colors"
            >
              <Icon name="lucide:menu" class="w-6 h-6 text-white" />
            </button>
            <h2 class="text-xl font-semibold text-white ml-4">{{ pageTitle }}</h2>
          </div>
          <div class="flex items-center space-x-4">
            <button class="p-2 hover:bg-[#7f13ec]/10 rounded-full relative">
              <Icon name="lucide:bell" class="w-5 h-5 text-white" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-[#7f13ec] rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6 text-white">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

const route = useRoute()
const isMobileMenuOpen = ref(false)
const currentUser = ref(null)
let authUnsubscribe = null

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Ferme le menu à chaque changement de route
watch(
  () => route.path,
  () => closeMobileMenu()
)

// Ferme le menu automatiquement si on passe en mode desktop
onMounted(() => {
  const mediaQuery = window.matchMedia('(min-width: 1024px)')

  const handleResize = (e) => {
    if (e.matches) closeMobileMenu()
  }

  mediaQuery.addEventListener('change', handleResize)

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleResize)
  })

  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
})

onUnmounted(() => {
  if (authUnsubscribe) authUnsubscribe()
})

const pageTitle = computed(() => {
  const path = route.path
  if (path === '/newproject') return 'Nouveau projet'
  if (path === '/projects') return 'Mes projets'
  if (path === '/billing') return 'Facturation'
  if (path === '/settings') return 'Paramètres'
  return 'Tableau de bord'
})
</script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #1e1530;
}
::-webkit-scrollbar-thumb {
  background: #7f13ec;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a855f7;
}
</style>