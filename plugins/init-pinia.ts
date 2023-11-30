import { useAuth } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  if (process.client) {
    const authStore = useAuth()
    authStore.nuxtClientInit()
  }
})