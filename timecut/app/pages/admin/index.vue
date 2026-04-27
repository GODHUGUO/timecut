<template>
  <!-- Loading -->
  <div v-if="loading" class="flex items-center justify-center py-20">
    <div class="w-8 h-8 border-2 border-[#7f13ec] border-t-transparent rounded-full animate-spin"></div>
  </div>
  <!-- Error -->
  <div v-else-if="error" class="text-center py-20 text-red-400">{{ error }}</div>
  <!-- Content -->
  <div v-else class="space-y-6 pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <span>Overview</span>
          <span>/</span>
          <span class="text-[#7f13ec]">Analytics</span>
        </div>
        <h1 class="text-3xl font-bold text-white">Performance Overview</h1>
      </div>
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2 px-4 py-2 bg-[#1e1333] border border-[#7f13ec]/20 rounded-xl text-sm text-white hover:bg-[#7f13ec]/10 transition-colors">
          <Icon name="lucide:calendar" class="w-4 h-4 text-gray-400" />
          <span>Last 30 Days</span>
        </button>
        <button class="p-2 bg-[#1e1333] border border-[#7f13ec]/20 rounded-xl hover:bg-[#7f13ec]/10 transition-colors">
          <Icon name="lucide:download" class="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6 relative"
      >
        <span class="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
          {{ stat.badge }}
        </span>
        <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" :class="stat.iconBg">
          <Icon :name="stat.icon" class="w-5 h-5 text-white" />
        </div>
        <p class="text-xs uppercase tracking-wider text-gray-400 mb-1">{{ stat.label }}</p>
        <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ stat.subtitle }}</p>
      </div>
    </div>

    

    <!-- Recent Payments + Top Users -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Recent Payments -->
      <div class="lg:col-span-2 bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Recent Payments</h2>
          <a href="#" class="text-sm text-[#7f13ec] hover:text-[#a855f7] transition-colors">View all</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs uppercase tracking-wider text-gray-400 border-b border-[#7f13ec]/10">
                <th class="text-left py-3 pr-4">User ID</th>
                <th class="text-left py-3 pr-4">Amount</th>
                <th class="text-left py-3 pr-4">Status</th>
                <th class="text-left py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment.id" class="border-b border-[#7f13ec]/5 last:border-0">
                <td class="py-3 pr-4 text-white font-medium">{{ payment.id }}</td>
                <td class="py-3 pr-4 text-white">€{{ payment.amount?.toFixed(2) }}</td>
                <td class="py-3 pr-4">
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="statusClass(payment.status)">
                    {{ statusLabel(payment.status) }}
                  </span>
                </td>
                <td class="py-3 text-gray-400">{{ new Date(payment.date).toLocaleDateString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Users -->
      <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Top Users</h2>
          <button class="p-1 hover:bg-[#7f13ec]/10 rounded-lg transition-colors">
            <Icon name="lucide:more-vertical" class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="space-y-4">
          <div v-for="(user, index) in topUsers" :key="user.name" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" :class="avatarColor(index)">
              {{ user.initial || user.name?.[0]?.toUpperCase() || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white font-medium truncate">{{ user.name }}</p>
              <p class="text-xs text-gray-400">{{ formatPlan(user.plan) }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-white">{{ user.minutesUsed ?? 0 }} min</p>
              <p class="text-[10px] uppercase text-gray-400">Used</p>
            </div>
          </div>
        </div>
      </div>
    </div>

   

    <!-- Footer -->
    <footer class="border-t border-[#7f13ec]/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
      <p>&copy; 202 SaaS Admin. Built with precision.</p>
      <div class="flex items-center gap-4">
        <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-green-400"></span>
          API Status
        </span>
      </div>
    </footer>
  </div>
  <!-- end v-else -->
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { fetchDashboardStats, fetchRecentPayments, fetchTopUsers: fetchTopUsersApi } = useAdmin()

const loading = ref(true)
const error = ref('')

const stats = ref({
  totalUsers: 0,
  totalVideos: 0,
  totalRevenue: 0,
  estimatedProfit: 0,
  pendingRevenue: 0,
  subsThisMonth: 0,
  avgVideosPerDay: 0,
  userGrowthPercent: 0,
  videoGrowthPercent: 0,
  revenueGrowthPercent: 0,
})

const payments = ref<any[]>([])
const topUsers = ref<any[]>([])

const statsCards = computed(() => [
  {
    label: 'Total Users',
    value: stats.value.totalUsers.toLocaleString(),
    subtitle: `+${stats.value.subsThisMonth} this month`,
    icon: 'lucide:user',
    iconBg: 'bg-[#7f13ec]',
    badge: `+${stats.value.userGrowthPercent}%`,
  },
  {
    label: 'Total Videos Created',
    value: stats.value.totalVideos.toLocaleString(),
    subtitle: `${stats.value.avgVideosPerDay} per day avg`,
    icon: 'lucide:video',
    iconBg: 'bg-[#7f13ec]',
    badge: `+${stats.value.videoGrowthPercent}%`,
  },
  {
    label: 'Total Revenue',
    value: `\u20AC${stats.value.totalRevenue.toLocaleString()}`,
    subtitle: `\u20AC${stats.value.pendingRevenue.toLocaleString()} pending`,
    icon: 'lucide:banknote',
    iconBg: 'bg-[#7f13ec]',
    badge: `+${stats.value.revenueGrowthPercent}%`,
  },
  {
    label: 'Estimated Profit',
    value: `\u20AC${stats.value.estimatedProfit.toLocaleString()}`,
    subtitle: 'After AI infra costs',
    icon: 'lucide:trending-up',
    iconBg: 'bg-[#7f13ec]',
    badge: `+${stats.value.revenueGrowthPercent}%`,
  },
])

const avatarColors = ['bg-[#7f13ec]', 'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-pink-500', 'bg-cyan-500']
const avatarColor = (index: number) => avatarColors[index % avatarColors.length]

const formatPlan = (plan: string) => {
  if (!plan) return 'Free Tier'
  const lower = plan.toLowerCase()
  if (lower === 'pro') return 'Pro Plan Member'
  if (lower === 'enterprise') return 'Enterprise'
  if (lower === 'free') return 'Free Tier'
  return plan
}

const statusClass = (status: string) => {
  const s = status?.toLowerCase()
  switch (s) {
    case 'completed': return 'bg-green-500/20 text-green-400'
    case 'pending': return 'bg-yellow-500/20 text-yellow-400'
    case 'failed': return 'bg-red-500/20 text-red-400'
    case 'cancelled': return 'bg-amber-500/20 text-amber-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

const statusLabel = (status: string) => {
  const s = status?.toLowerCase()
  switch (s) {
    case 'completed': return 'SUCCESS'
    case 'pending': return 'PENDING'
    case 'failed': return 'FAILED'
    case 'cancelled': return 'REFUNDED'
    default: return status?.toUpperCase()
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const [dashStats, recentPay, topU] = await Promise.all([
      fetchDashboardStats(),
      fetchRecentPayments(),
      fetchTopUsersApi(),
    ])
    stats.value = dashStats as any
    payments.value = (recentPay as any)?.payments || recentPay as any
    topUsers.value = (topU as any)?.users || topU as any
  } catch (e: any) {
    error.value = e.message || 'Failed to load dashboard data'
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
  }
})
</script>
