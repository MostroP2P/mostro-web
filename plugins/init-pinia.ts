import { useAuth } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    const authStore = useAuth()
    authStore.nuxtClientInit()
    const ordersStore = useOrders()
    ordersStore.nuxtClientInit()
    const messagesStore = useMessages()
    messagesStore.nuxtClientInit()
  }
})