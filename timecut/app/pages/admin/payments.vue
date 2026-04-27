<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-sm mb-2">
          <span class="text-gray-400">Finance</span>
          <span class="text-gray-500">&gt;</span>
          <span class="text-white font-medium">Payments &amp; Revenue</span>
        </div>
        <h1 class="text-3xl font-bold text-white">Payments &amp; Revenue</h1>
        <p class="text-gray-400 mt-1">Track all transactions, subscriptions, and financial logs.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2 px-4 py-2.5 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-sm text-white hover:bg-[#3a2a54] transition-colors">
          <Icon name="lucide:calendar" class="w-4 h-4" />
          <span>Last 30 Days</span>
        </button>
        <button class="flex items-center gap-2 px-4 py-2.5 bg-[#7f13ec] hover:bg-[#a855f7] rounded-lg text-sm text-white font-medium transition-colors">
          <Icon name="lucide:download" class="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="w-10 h-10 rounded-lg bg-[#7f13ec] flex items-center justify-center">
            <Icon :name="stat.icon" class="w-5 h-5 text-white" />
          </div>
          <span
            class="text-xs font-medium px-2.5 py-1 rounded-full"
            :class="stat.badgeClass"
          >
            {{ stat.badge }}
          </span>
        </div>
        <p class="text-xs uppercase tracking-wider text-gray-400 mb-1">{{ stat.label }}</p>
        <p class="text-3xl font-bold text-white mb-2">{{ stat.value }}</p>
        <p class="text-sm text-gray-400 flex items-center gap-1">
          <span>{{ stat.subtitle }}</span>
        </p>
      </div>
    </div>

    <!-- Transaction Filters -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="flex items-center bg-[#2a1a44] rounded-full p-1">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="px-4 py-1.5 text-sm font-medium rounded-full transition-colors"
            :class="activeTab === tab.value ? 'bg-white text-black' : 'text-gray-400 hover:text-white'"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
        <select
          v-model="statusFilter"
          class="px-3 py-1.5 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-sm text-gray-300 appearance-none cursor-pointer"
        >
          <option value="all">Status: All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Refunded</option>
        </select>
        <button class="flex items-center gap-2 px-3 py-1.5 bg-[#2a1a44] border border-[#7f13ec]/20 rounded-lg text-sm text-gray-300">
          <Icon name="lucide:calendar" class="w-4 h-4" />
          <span>Date Range</span>
        </button>
      </div>
      <span class="text-sm text-gray-400">Showing {{ total }} transactions</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-2 border-[#7f13ec] border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
      <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p class="text-red-400">{{ error }}</p>
      <button @click="loadPayments()" class="mt-4 px-4 py-2 bg-[#7f13ec] rounded-lg text-sm text-white hover:bg-[#a855f7] transition-colors">
        Retry
      </button>
    </div>

    <!-- Transactions Table -->
    <div v-else class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-[#7f13ec]/10">
              <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-medium">Transaction ID</th>
              <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-medium">User</th>
              <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-medium">Amount</th>
              <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-medium">Status</th>
              <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-medium">Date</th>
              <th class="text-left px-6 py-4 text-xs uppercase text-gray-500 tracking-wider font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="transactions.length === 0">
              <td colspan="6" class="px-6 py-16 text-center">
                <Icon name="lucide:inbox" class="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p class="text-gray-400">No transactions found</p>
              </td>
            </tr>
            <tr
              v-for="(tx, index) in transactions"
              :key="tx.id"
              class="border-b border-[#7f13ec]/10 hover:bg-[#2a1a44]/50 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-white font-mono">{{ tx.id.startsWith('#') ? tx.id : '#' + tx.id }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    :class="getAvatarColor(index)"
                  >
                    {{ tx.name?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ tx.name }}</p>
                    <p class="text-xs text-gray-400">{{ tx.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-white font-medium">€{{ Number(tx.amount).toFixed(2) }}</td>
              <td class="px-6 py-4">
                <span class="flex items-center gap-1.5 text-sm" :class="statusClass(tx.status)">
                  <span class="w-2 h-2 rounded-full" :class="statusDotClass(tx.status)"></span>
                  {{ statusLabel(tx.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-400">{{ formatDate(tx.date) }}</td>
              <td class="px-6 py-4">
                <button class="p-1.5 hover:bg-[#7f13ec]/10 rounded-lg transition-colors">
                  <Icon :name="getActionIcon(tx.status)" class="w-4 h-4 text-gray-400" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#7f13ec]/10">
        <span class="text-sm text-gray-400">
          Showing {{ Math.min((page - 1) * limit + 1, total) }} to {{ Math.min(page * limit, total) }} of {{ total }} transactions
        </span>
        <div class="flex items-center gap-1 mt-3 sm:mt-0">
          <button
            @click="prevPage()"
            :disabled="page <= 1"
            class="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-[#2a1a44] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
            Previous
          </button>
          <template v-for="p in paginationPages" :key="p">
            <span v-if="p === '...'" class="text-gray-500 px-1">...</span>
            <button
              v-else
              @click="goToPage(p as number)"
              class="w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors"
              :class="page === p ? 'bg-[#7f13ec] text-white font-medium' : 'text-gray-400 hover:bg-[#2a1a44] hover:text-white'"
            >
              {{ p }}
            </button>
          </template>
          <button
            @click="nextPage()"
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-[#2a1a44] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    

    <!-- Storage Usage -->
    <div class="max-w-xs bg-[#1e1333] border border-[#7f13ec]/20 rounded-xl p-4">
      <p class="text-sm font-medium text-white mb-2">Storage Usage</p>
      <div class="w-full h-2 bg-[#2a1a44] rounded-full overflow-hidden mb-2">
        <div class="h-full w-[60%] bg-gradient-to-r from-[#7f13ec] to-[#a855f7] rounded-full"></div>
      </div>
      <p class="text-xs text-gray-400">1.2 TB of 2 TB used</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { fetchPaymentsStats, fetchPayments } = useAdmin()

const loading = ref(true)
const error = ref('')
const page = ref(1)
const limit = ref(20)
const statusFilter = ref('all')
const activeTab = ref('all')
const total = ref(0)

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Subscriptions', value: 'subscriptions' },
  { label: 'Add-ons', value: 'addons' },
]

const paymentStats = ref({
  monthlyRevenue: 0,
  previousMonthRevenue: 0,
  revenueGrowthPercent: 0,
  pendingPayouts: 0,
  pendingCount: 0,
  refundRate: 0,
  refundRateChange: 0,
})

const transactions = ref<any[]>([])

const stats = computed(() => [
  {
    label: 'Total Monthly Revenue',
    value: `€${paymentStats.value.monthlyRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
    icon: 'lucide:credit-card',
    badge: `+${paymentStats.value.revenueGrowthPercent}%`,
    badgeClass: 'bg-green-500/20 text-green-400',
    subtitle: `vs €${paymentStats.value.previousMonthRevenue.toLocaleString()} last month`,
  },
  {
    label: 'Pending Payouts',
    value: `€${paymentStats.value.pendingPayouts.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`,
    icon: 'lucide:wallet',
    badge: `${paymentStats.value.pendingCount} Trans.`,
    badgeClass: 'bg-gray-500/20 text-gray-300',
    subtitle: 'Estimated delivery: Tomorrow',
  },
  {
    label: 'Refund Rate',
    value: `${paymentStats.value.refundRate}%`,
    icon: 'lucide:refresh-cw',
    badge: `${paymentStats.value.refundRateChange}%`,
    badgeClass: paymentStats.value.refundRateChange < 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400',
    subtitle: 'Historical average: 1.62%',
  },
])

const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500']
const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

const statusClass = (status: string) => {
  if (status === 'completed') return 'text-green-400'
  if (status === 'failed') return 'text-red-400'
  if (status === 'cancelled') return 'text-amber-400'
  if (status === 'pending') return 'text-yellow-400'
  return 'text-gray-400'
}

const statusDotClass = (status: string) => {
  if (status === 'completed') return 'bg-green-400'
  if (status === 'failed') return 'bg-red-400'
  if (status === 'cancelled') return 'bg-amber-400'
  if (status === 'pending') return 'bg-yellow-400'
  return 'bg-gray-400'
}

const statusLabel = (status: string) => {
  if (status === 'completed') return 'Success'
  if (status === 'failed') return 'Failed'
  if (status === 'cancelled') return 'Refunded'
  if (status === 'pending') return 'Pending'
  return status
}

const getActionIcon = (status: string) => {
  if (status === 'completed' || status === 'pending') return 'lucide:download'
  if (status === 'failed') return 'lucide:info'
  if (status === 'cancelled') return 'lucide:clock'
  return 'lucide:download'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const totalPages = computed(() => Math.ceil(total.value / limit.value))

const paginationPages = computed(() => {
  const tp = totalPages.value
  const current = page.value
  if (tp <= 5) return Array.from({ length: tp }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(tp - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < tp - 2) pages.push('...')
  pages.push(tp)
  return pages
})

const goToPage = (p: number) => {
  page.value = p
  loadPayments()
}
const nextPage = () => { if (page.value < totalPages.value) goToPage(page.value + 1) }
const prevPage = () => { if (page.value > 1) goToPage(page.value - 1) }

const loadPayments = async () => {
  try {
    loading.value = true
    error.value = ''
    const [statsData, paymentsData] = await Promise.all([
      fetchPaymentsStats(),
      fetchPayments(page.value, limit.value, statusFilter.value, activeTab.value),
    ])
    paymentStats.value = statsData as any
    transactions.value = (paymentsData as any).payments
    total.value = (paymentsData as any).total
  } catch (e: any) {
    error.value = e.message || 'Failed to load payments'
    console.error('Payments load error:', e)
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => {
  page.value = 1
  loadPayments()
})

watch(statusFilter, () => {
  page.value = 1
  loadPayments()
})

onMounted(() => loadPayments())
</script>
