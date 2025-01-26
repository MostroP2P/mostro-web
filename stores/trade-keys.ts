import { defineStore } from 'pinia'
import { TradeKeyManager } from '~/utils/trade-keys'

export const useTradeKeys = defineStore('trade-keys', () => {
  const manager = new TradeKeyManager()

  return {
    init: () => manager.init(),
    getIdentityKey: () => manager.getIdentityKey(),
    getKeyByOrderId: (orderId: string) => manager.getKeyByOrderId(orderId),
    storeTradeKey: (orderId: string | null, derivedKey: string) => manager.storeTradeKey(orderId, derivedKey),
    updateKeyOrderId: (keyIndex: number, orderId: string) => manager.updateKeyOrderId(keyIndex, orderId),
    nextKeyIndex: computed(() => manager.nextKeyIndex)
  }
}) 