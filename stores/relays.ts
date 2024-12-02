import type { NDKRelay } from '@nostr-dev-kit/ndk'
import { defineStore } from 'pinia'
import type { Mostro } from '~/utils/mostro'

export const useRelays = defineStore('relays', {
  state: () => ({
    relays: [] as { url: string, status: string }[]
  }),
  actions: {
    nuxtClientInit() {
      const mostro = useNuxtApp().$mostro as Mostro
      const nostr = mostro.getNostr()
      nostr.on('relay:connecting', (relay: NDKRelay) => {
        this.updateRelayStatus(relay.url, 'yellow')
      })
      nostr.on('relay:ready', (relay: NDKRelay) => {
        this.updateRelayStatus(relay.url, 'green')
      })
      nostr.on('relay:disconnect', (relay: NDKRelay) => {
        this.updateRelayStatus(relay.url, 'red')
      })
      nostr.on('relay:flapping', (relay: NDKRelay) => {
        this.updateRelayStatus(relay.url, 'orange')
      })
      nostr.on('relay:notice', (relay: NDKRelay, err: any) => {
        this.updateRelayStatus(relay.url, 'blue')
      })
    },
    updateRelayStatus(relayUrl: string, status: string) {
      const relayIndex = this.relays.findIndex(r => r.url === relayUrl)
      if (relayIndex !== -1) {
        this.relays[relayIndex].status = status
      } else {
        this.relays.push({ url: relayUrl, status })
      }
    },
    removeRelay(relayUrl: string) {
      const relayIndex = this.relays.findIndex(r => r.url === relayUrl)
      if (relayIndex !== -1) {
        this.relays.splice(relayIndex, 1)
      }
    }
  }
})