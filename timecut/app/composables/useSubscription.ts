import { computed } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'
import { PLAN_CATALOG } from '../utils/plans'

export const useSubscription = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const subscription = useState('subscription:data', () => null)
  const isLoading = useState('subscription:loading', () => false)

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
    }
  }

  const refreshSubscription = async () => {
    isLoading.value = true

    try {
      const headers = await getAuthHeaders()
      subscription.value = await $fetch(`${apiBase}/video/subscription`, {
        headers,
      })
      return subscription.value
    } finally {
      isLoading.value = false
    }
  }

  const changePlan = async (plan) => {
    isLoading.value = true

    try {
      const headers = await getAuthHeaders()
      subscription.value = await $fetch(`${apiBase}/video/subscription`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: { plan },
      })
      return subscription.value
    } finally {
      isLoading.value = false
    }
  }

  const currentPlan = computed(() => subscription.value?.currentPlan || 'free')
  const currentPlanDetails = computed(() => PLAN_CATALOG[currentPlan.value] || PLAN_CATALOG.free)

  return {
    subscription,
    isLoading,
    currentPlan,
    currentPlanDetails,
    refreshSubscription,
    changePlan,
    getAuthHeaders,
  }
}
