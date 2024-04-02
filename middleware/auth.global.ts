import { useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuth()

  const allowedPaths = ['/', '/about']
  if (!authStore.isAuthenticated && !allowedPaths.includes(to.path)) {
    // Redirect them to the login page if they're not authenticated
    return navigateTo('/')
  }
})
