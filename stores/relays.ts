import { defineStore } from 'pinia'

export const useRelays = defineStore('relays', {
  state: () => ({
    relays: [] as { url: string, status: string }[]
  }),
  actions: {
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