import { onAuthStateChanged, type User } from 'firebase/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const publicPages = ['/', '/login', '/pricing', '/contact']

  const isPublicPage = publicPages.includes(to.path)

  const { $auth } = useNuxtApp() as unknown as { $auth: ReturnType<typeof import('firebase/auth').getAuth> }

  if (!$auth) return

  const user = await new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged($auth, (firebaseUser) => {
      unsubscribe()
      resolve(firebaseUser)
    })
  })

  // Si connecté et essaie d'accéder à /login → redirige vers dashboard
  if (user && to.path === '/login') {
    return navigateTo('/newproject')
  }

  // Si non connecté et page privée → redirige vers /login
  if (!user && !isPublicPage) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})