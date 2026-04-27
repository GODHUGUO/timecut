<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 border-4 border-[#7f13ec] border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-400 text-sm">Loading users...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-4 text-center">
        <Icon name="lucide:alert-circle" class="w-10 h-10 text-red-400" />
        <p class="text-red-400 text-sm">{{ error }}</p>
        <button @click="loadUsers" class="px-4 py-2 bg-[#7f13ec] hover:bg-[#a855f7] rounded-lg text-white text-sm font-medium transition-colors">
          Retry
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-white">Users Management</h1>
          <p class="text-gray-400 mt-1">Manage your users, their plans, and their platform usage.</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 px-4 py-2.5 bg-[#1e1333] border border-[#7f13ec]/20 rounded-lg text-white text-sm font-medium hover:bg-[#2a1a44] transition-colors">
            <Icon name="lucide:sliders-horizontal" class="w-4 h-4" />
            Filter
          </button>
          <button class="flex items-center gap-2 px-4 py-2.5 bg-[#7f13ec] hover:bg-[#a855f7] rounded-lg text-white text-sm font-medium transition-colors">
            <Icon name="lucide:user-plus" class="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div v-for="stat in stats" :key="stat.label" class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6" :class="stat.borderClass">
          <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">{{ stat.label }}</p>
          <p class="text-3xl font-bold text-white">{{ stat.value }}</p>
          <p class="text-sm mt-2" :class="stat.subtitleClass" v-html="stat.subtitle"></p>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <div class="relative flex-1 w-full">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Search by name, email or handle..."
            class="w-full pl-10 pr-4 py-2.5 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#7f13ec] focus:ring-1 focus:ring-[#7f13ec]/50 transition-colors"
          />
        </div>
        <select
          v-model="planFilter"
          class="px-4 py-2.5 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-sm text-white focus:outline-none focus:border-[#7f13ec] appearance-none pr-8 cursor-pointer"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </select>
        <span class="text-sm text-gray-400 whitespace-nowrap">
          Showing {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, total) }} of {{ total.toLocaleString() }}
        </span>
      </div>

      <!-- Users Table -->
      <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#7f13ec]/10">
                <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-semibold">User</th>
                <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-semibold">Plan</th>
                <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-semibold">Status</th>
                <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-semibold">Minutes Used</th>
                <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              <!-- Empty state -->
              <tr v-if="users.length === 0">
                <td colspan="5" class="px-6 py-16 text-center">
                  <p class="text-gray-400 text-sm">No users found</p>
                </td>
              </tr>
              <tr
                v-for="(user, index) in users"
                :key="user.email"
                class="border-b border-[#7f13ec]/10 last:border-b-0 hover:bg-[#2a1a44]/50 transition-colors"
              >
                <!-- User -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      :style="{ backgroundColor: getAvatarColor(user.name, index) }"
                    >
                      {{ user.name?.charAt(0)?.toUpperCase() || '?' }}
                    </div>
                    <div>
                      <p class="text-white font-semibold text-sm">{{ user.name }}</p>
                      <p class="text-gray-400 text-xs">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <!-- Plan -->
                <td class="px-6 py-4">
                  <span
                    class="text-xs px-2 py-1 rounded font-medium"
                    :class="user.plan?.toUpperCase() === 'PRO' ? 'bg-[#7f13ec]/20 text-[#a855f7]' : 'bg-gray-600/20 text-gray-400'"
                  >
                    {{ user.plan?.toUpperCase() }}
                  </span>
                </td>
                <!-- Status -->
                <td class="px-6 py-4">
                  <span class="flex items-center gap-1.5 text-sm">
                    <span class="w-2 h-2 rounded-full" :class="user.status?.toLowerCase() === 'active' ? 'bg-green-400' : 'bg-gray-500'"></span>
                    <span :class="user.status?.toLowerCase() === 'active' ? 'text-green-400' : 'text-gray-400'">{{ user.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive' }}</span>
                  </span>
                </td>
                <!-- Minutes Used -->
                <td class="px-6 py-4">
                  <div class="min-w-[160px]">
                    <div class="flex items-center justify-between text-xs mb-1.5">
                      <span class="text-gray-300">{{ user.minutesUsed }} / {{ user.minutesTotal }}m</span>
                      <span class="text-gray-400">{{ Math.round((user.minutesUsed / user.minutesTotal) * 100) }}%</span>
                    </div>
                    <div class="h-1.5 bg-[#3d2460] rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="(user.minutesUsed / user.minutesTotal * 100) >= 80 ? 'bg-gradient-to-r from-pink-500 to-red-400' : 'bg-gradient-to-r from-[#7f13ec] to-[#a855f7]'"
                        :style="{ width: Math.round((user.minutesUsed / user.minutesTotal) * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </td>
                <!-- Last Active -->
                <td class="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{{ formatRelativeTime(user.lastActive) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between">
        <button
          @click="prevPage"
          :disabled="page <= 1"
          class="px-4 py-2 border border-[#7f13ec]/20 rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#7f13ec]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div class="flex items-center gap-1">
          <button
            v-for="p in visiblePages"
            :key="p"
            @click="goToPage(p)"
            class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
            :class="p === page ? 'bg-[#7f13ec] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2a1a44]'"
          >
            {{ p }}
          </button>
          <template v-if="totalPages > 5">
            <span class="text-gray-500 px-1">...</span>
            <button
              @click="goToPage(totalPages)"
              class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
              :class="page === totalPages ? 'bg-[#7f13ec] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2a1a44]'"
            >
              {{ totalPages }}
            </button>
          </template>
        </div>
        <button
          @click="nextPage"
          :disabled="page >= totalPages"
          class="px-4 py-2 border border-[#7f13ec]/20 rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#7f13ec]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { fetchUsersStats, fetchUsers } = useAdmin()

const loading = ref(true)
const error = ref('')
const page = ref(1)
const limit = ref(20)
const search = ref('')
const planFilter = ref('all')
const total = ref(0)

const userStats = ref({
  totalUsers: 0,
  proUsers: 0,
  proConversionRate: 0,
  activeNow: 0,
  avgUsagePerMonth: 0,
})

const users = ref<any[]>([])

const stats = computed(() => [
  {
    label: 'Total Users',
    value: userStats.value.totalUsers.toLocaleString(),
    subtitle: '↗ Users on the platform',
    subtitleClass: 'text-green-400',
    borderClass: 'border-l-4 !border-l-[#7f13ec]',
  },
  {
    label: 'Pro Users',
    value: userStats.value.proUsers.toLocaleString(),
    subtitle: `📊 ${userStats.value.proConversionRate}% Conversion`,
    subtitleClass: 'text-gray-400',
    borderClass: '',
  },
  {
    label: 'Active Now',
    value: userStats.value.activeNow.toLocaleString(),
    subtitle: '<span class="inline-block w-2 h-2 rounded-full bg-green-400 mr-1 align-middle"></span>Live platform traffic',
    subtitleClass: 'text-green-400',
    borderClass: '',
  },
  {
    label: 'Avg. Usage',
    value: `${userStats.value.avgUsagePerMonth}m`,
    subtitle: 'Per user / month',
    subtitleClass: 'text-gray-400',
    borderClass: '',
  },
])

const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1)

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = Math.min(5, totalPages.value)
  let start = Math.max(1, page.value - 2)
  const end = Math.min(totalPages.value, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const avatarColors = ['#7f13ec', '#c026d3', '#2563eb', '#e11d48', '#0891b2', '#9333ea', '#ea580c', '#16a34a', '#d946ef', '#0284c7', '#f59e0b', '#059669', '#db2777', '#7c3aed']

const getAvatarColor = (name: string, index: number): string => {
  if (!name) return avatarColors[index % avatarColors.length]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} mins ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days ago`
}

const loadUsers = async () => {
  try {
    loading.value = true
    error.value = ''
    const [statsData, usersData] = await Promise.all([
      fetchUsersStats(),
      fetchUsers(page.value, limit.value, search.value, planFilter.value),
    ])
    userStats.value = statsData as any
    users.value = (usersData as any).users
    total.value = (usersData as any).total
  } catch (e: any) {
    error.value = e.message || 'Failed to load users'
    console.error('Users load error:', e)
  } finally {
    loading.value = false
  }
}

const goToPage = (p: number) => {
  page.value = p
  loadUsers()
}

const nextPage = () => {
  if (page.value < totalPages.value) goToPage(page.value + 1)
}

const prevPage = () => {
  if (page.value > 1) goToPage(page.value - 1)
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 500)
})

watch(planFilter, () => {
  page.value = 1
  loadUsers()
})

onMounted(() => loadUsers())
</script>
