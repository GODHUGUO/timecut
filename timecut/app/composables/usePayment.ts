import { ref } from 'vue'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

export const usePayment = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const isPaying = ref(false)

  const getCurrentUser = async (): Promise<User | null> => {
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

  const createCheckout = async (plan: string) => {
    isPaying.value = true

    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const headers = await getAuthHeaders()
      const response = await $fetch(`${apiBase}/payment/checkout`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: {
          plan,
          customerEmail: user.email || undefined,
        },
      }) as { paymentUrl?: string; paymentId?: string; error?: string }

      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.paymentUrl) {
        throw new Error('Aucune URL de paiement reçue')
      }

      // Redirection vers LeekPay
      window.location.href = response.paymentUrl
      return response
    } finally {
      isPaying.value = false
    }
  }

  return {
    isPaying,
    createCheckout,
  }
}
