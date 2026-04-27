import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

export const useAdmin = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const getCurrentUser = async () => {
    if (auth.currentUser) return auth.currentUser

    return new Promise((resolve) => {
      const off = onAuthStateChanged(auth, (user) => {
        off()
        resolve(user)
      })
    })
  }

  const getAuthHeaders = async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const token = await user.getIdToken()
    return {
      Authorization: `Bearer ${token}`,
      'x-user-id': user.uid,
      'Content-Type': 'application/json',
    }
  }

  // Dashboard
  const fetchDashboardStats = async () => {
    const headers = await getAuthHeaders()
    const res = await $fetch(`${apiBase}/admin/dashboard/stats`, { headers })
    return res
  }

  const fetchRecentPayments = async () => {
    const headers = await getAuthHeaders()
    const res = await $fetch(`${apiBase}/admin/payments/recent`, { headers })
    return res
  }

  const fetchTopUsers = async () => {
    const headers = await getAuthHeaders()
    const res = await $fetch(`${apiBase}/admin/users/top`, { headers })
    return res
  }

  // Users page
  const fetchUsersStats = async () => {
    const headers = await getAuthHeaders()
    const res = await $fetch(`${apiBase}/admin/users/stats`, { headers })
    return res
  }

  const fetchUsers = async (page = 1, limit = 20, search = '', plan = 'all') => {
    const headers = await getAuthHeaders()
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    if (plan && plan !== 'all') params.append('plan', plan)
    const res = await $fetch(`${apiBase}/admin/users?${params.toString()}`, { headers })
    return res
  }

  // Payments page
  const fetchPaymentsStats = async () => {
    const headers = await getAuthHeaders()
    const res = await $fetch(`${apiBase}/admin/payments/stats`, { headers })
    return res
  }

  const fetchPayments = async (page = 1, limit = 20, status = 'all', tab = 'all') => {
    const headers = await getAuthHeaders()
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status && status !== 'all') params.append('status', status)
    if (tab && tab !== 'all') params.append('tab', tab)
    const res = await $fetch(`${apiBase}/admin/payments?${params.toString()}`, { headers })
    return res
  }

  // Admin password verification
  const verifyAdminPassword = async (password: string) => {
    const headers = await getAuthHeaders()
    const res = await $fetch<{ valid: boolean }>(`${apiBase}/admin/verify-password`, {
      method: 'POST',
      headers,
      body: { password },
    })
    return res
  }

  return {
    fetchDashboardStats,
    fetchRecentPayments,
    fetchTopUsers,
    fetchUsersStats,
    fetchUsers,
    fetchPaymentsStats,
    fetchPayments,
    verifyAdminPassword,
  }
}
