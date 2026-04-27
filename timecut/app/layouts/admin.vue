<template>
  <div class="h-screen bg-[#191022] flex overflow-hidden">
    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-50 w-64 bg-[#191022] text-white shadow-xl border-r border-[#7f13ec]/20 transition-transform duration-300 ease-in-out lg:translate-x-0 -translate-x-full flex flex-col h-screen"
      :class="{ 'translate-x-0': isMobileMenuOpen }"
    >
      <!-- Logo -->
      <div class="shrink-0 mt-6 px-4 py-2 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-[#7f13ec] flex items-center justify-center">
          <Icon name="lucide:film" class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="text-lg font-bold leading-tight">
            <span class="text-white">Time</span><span class="text-[#7f13ec]">Cut</span>
          </div>
          <div class="text-[10px] uppercase tracking-widest text-gray-400">Admin</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="closeMobileMenu"
          class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors relative"
          :class="isActive(item.to)
            ? 'text-[#7f13ec] bg-[#7f13ec]/10 border-l-2 border-[#7f13ec]'
            : 'text-gray-400 hover:text-white hover:bg-[#7f13ec]/10 border-l-2 border-transparent'"
        >
          <Icon :name="item.icon" class="w-5 h-5 mr-3" />
          <span>{{ item.label }}</span>
        </NuxtLink>

 
        
      </nav>

      <!-- Bottom section -->
      <div class="shrink-0 border-t border-[#7f13ec]/20">
        <!-- Admin user info -->
        <div class="px-4 py-3 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#7f13ec]/30 flex items-center justify-center shrink-0 text-sm font-bold text-[#7f13ec]">
            {{ currentUser.initial }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ currentUser.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ currentUser.email }}</p>
          </div>
        </div>

        <!-- Support & Logout -->
        <div class="px-3 pb-4 space-y-1">
          <button class="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-[#7f13ec]/10 transition-colors">
            <Icon name="lucide:help-circle" class="w-4 h-4 mr-3" />
            <span>Support</span>
          </button>
          <button
            @click="handleLogout"
            class="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-[#7f13ec]/10 transition-colors"
          >
            <Icon name="lucide:log-out" class="w-4 h-4 mr-3" />
            <span>Logout</span>
          </button>
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
      <header class="shrink-0 bg-[#191022] border-b border-[#7f13ec]/20 shadow-sm z-20 sticky top-0">
        <div class="flex items-center justify-between px-6 py-3">
          <div class="flex items-center flex-1">
            <!-- Hamburger mobile -->
            <button
              @click="toggleMobileMenu"
              class="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[#7f13ec]/10 transition-colors mr-3"
            >
              <Icon name="lucide:menu" class="w-6 h-6 text-white" />
            </button>

            <!-- Global search -->
            <div class="relative w-full max-w-xl">
              <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search across users, videos, or transactions..."
                class="w-full pl-10 pr-4 py-2 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#7f13ec] focus:ring-1 focus:ring-[#7f13ec]/50 transition-colors"
              />
            </div>
          </div>

          <!-- Right side icons -->
          <div class="flex items-center space-x-3 ml-4">
            <button class="p-2 hover:bg-[#7f13ec]/10 rounded-full relative transition-colors">
              <Icon name="lucide:bell" class="w-5 h-5 text-gray-400 hover:text-white" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-[#7f13ec] rounded-full"></span>
            </button>
            <button class="p-2 hover:bg-[#7f13ec]/10 rounded-full transition-colors">
              <Icon name="lucide:settings" class="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <div class="w-8 h-8 rounded-full bg-[#7f13ec]/30 flex items-center justify-center cursor-pointer">
              <Icon name="lucide:user" class="w-4 h-4 text-[#7f13ec]" />
            </div>
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

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Admin access via URL slug
if (import.meta.client) {
  const isAdminAuth = sessionStorage.getItem('admin_authenticated')

  if (!isAdminAuth) {
    // Check for access key in URL query params
    const route = useRoute()
    const accessKey = route.query.access as string

    if (accessKey) {
      // Verify against backend
      const { verifyAdminPassword } = useAdmin()
      verifyAdminPassword(accessKey).then((result: any) => {
        if (result?.valid) {
          sessionStorage.setItem('admin_authenticated', 'true')
          // Clean the URL by removing the access query param
          const router = useRouter()
          const query = { ...route.query }
          delete query.access
          router.replace({ path: route.path, query })
        } else {
          navigateTo('/')
        }
      }).catch(() => {
        navigateTo('/')
      })
    } else {
      navigateTo('/')
    }
  }
}

const route = useRoute()
const router = useRouter()
const isMobileMenuOpen = ref(false)
const searchQuery = ref('')

const currentUser = ref<{ name: string; email: string; initial: string }>({
  name: 'Admin',
  email: '',
  initial: 'A',
})

const navItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/admin' },
  { label: 'Users', icon: 'lucide:users', to: '/admin/users' },
  { label: 'Payments', icon: 'lucide:credit-card', to: '/admin/payments' },
]

const isActive = (path: string) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleLogout = () => {
  if (import.meta.client) {
    sessionStorage.removeItem('admin_authenticated')
  }
  navigateTo('/')
}

watch(() => route.path, () => closeMobileMenu())

const mediaQuery = ref<MediaQueryList | null>(null)
const handleResize = (e: MediaQueryListEvent) => {
  if (e.matches) closeMobileMenu()
}

onMounted(() => {
  mediaQuery.value = window.matchMedia('(min-width: 1024px)')
  mediaQuery.value.addEventListener('change', handleResize)

  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser.value = {
        name: user.displayName || user.email?.split('@')[0] || 'Admin',
        email: user.email || '',
        initial: (user.displayName || user.email || 'A')[0].toUpperCase(),
      }
    }
  })
})

onUnmounted(() => {
  mediaQuery.value?.removeEventListener('change', handleResize)
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
