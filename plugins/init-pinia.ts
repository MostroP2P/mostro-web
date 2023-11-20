import { useAuth } from '~/stores/auth'

export default function () {
  if (process.client) {
    const authStore = useAuth()
    authStore.nuxtClientInit()
  }
}