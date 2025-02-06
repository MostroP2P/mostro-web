import { defineStore } from 'pinia'
import { KeyManager } from '~/utils/key-manager'

export const useTradeKeys = defineStore('trade-keys', () => {
  const manager = new KeyManager()

  return {
    init: (mnemonic: string) => manager.init(mnemonic),
    getIdentityKey: () => manager.getIdentityKey(),
    getKeyByOrderId: (orderId: string) => manager.getKeyByOrderId(orderId),
    storeTradeKey: (orderId: string | null, derivedKey: string) => manager.storeTradeKey(orderId, derivedKey),
    updateKeyOrderId: (keyIndex: number, orderId: string) => manager.updateKeyOrderId(keyIndex, orderId),
    nextKeyIndex: computed(() => manager.nextKeyIndex)
  }
}) 