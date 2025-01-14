import { Mostro, type MostroOptions } from "~/utils/mostro"

// Type declarations for Nuxt
declare module '#app' {
  interface NuxtApp {
    $mostro: Mostro
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $mostro: Mostro
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const { public: { mostroPubKey, relays } } = config
  const opts: MostroOptions = {
    mostroPubKey,
    relays,
    debug: true
  }
  const mostro = new Mostro(opts)
  nuxtApp.provide('mostro', mostro)
})
