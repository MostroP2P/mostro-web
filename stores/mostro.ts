import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MostroInfo {
  mostro_pubkey: string
  mostro_version: string
  mostro_commit_id: string
  max_order_amount: number
  min_order_amount: number
  expiration_hours: number
  expiration_seconds: number
  fee: number
  hold_invoice_expiration_window: number
  invoice_expiration_window: number
}

export const useMostroStore = defineStore('mostro', () => {
  const mostroMap = ref<Record<string, MostroInfo>>({})

  const getMostroInfo = computed(() => (pubkey: string) => {
    return mostroMap.value[pubkey]
  })

  function addMostroInfo(info: MostroInfo) {
    mostroMap.value[info.mostro_pubkey] = info
  }

  function removeMostroInfo(pubkey: string) {
    delete mostroMap.value[pubkey]
  }

  return {
    mostroMap,
    getMostroInfo,
    addMostroInfo,
    removeMostroInfo,
  }
})