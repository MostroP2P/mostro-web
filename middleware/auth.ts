import { AuthMethod, useAuth } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  // Use the isLocked getter to determine if the user is authenticated
  const authStore = useAuth()

  if (!authStore.isAuthenticated) {
    // Redirect them to the login page if they're not authenticated
    return navigateTo('/')
  }
})
