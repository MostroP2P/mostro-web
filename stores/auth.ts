import { watch } from 'vue'
import { AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC, AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC } from './types'
import { nip19 } from 'nostr-tools'

export interface AuthState {
  encryptedMnemonic: string | null,
  mnemonic: string | null
}

export function isNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec)
    return decoded.type === 'nsec'
  } catch (error) {
    return false
  }
}

export const useAuth = defineStore('auth', {
  state: () => ({
    encryptedMnemonic: null as EncryptedMnemonic | null,
    mnemonic: null as string | null
  }),
  actions: {
    nuxtClientInit() {
      const encryptedMnemonic = localStorage.getItem(AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC)
      if(encryptedMnemonic) {
        this.encryptedMnemonic = JSON.parse(encryptedMnemonic)
      }
      const mnemonic = localStorage.getItem(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
      if (mnemonic) {
        try {
          this.mnemonic = mnemonic
          const { $mostro } = useNuxtApp()
          $mostro.updateMnemonic(mnemonic)
        } catch(err) {
          console.warn('Error setting mnemonic from local storage: ', err)
          this.delete()
        }
      }
      watch(() => this.encryptedMnemonic, (newEncryptedMnemonic) => {
        if (newEncryptedMnemonic) {
          localStorage.setItem(AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC, JSON.stringify(newEncryptedMnemonic))
        }
      })
      watch(() => this.mnemonic, (newMnemonic) => {
        if (newMnemonic) {
          localStorage.setItem(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC, newMnemonic)
        }
      })
    },
    login(mnemonic: string) {
      this.mnemonic = mnemonic

      // Initialize KeyManager
      const keyManager = new KeyManager()
      keyManager.init(this.mnemonic)
    },
    setEncryptedMnemonic(encryptedMnemonic: EncryptedMnemonic) {
      this.encryptedMnemonic = encryptedMnemonic
    },
    setMnemonic(mnemonic: string) {
      this.mnemonic = mnemonic
    },
    delete() {
      this.logout()
      this.encryptedMnemonic = null
      this.mnemonic = null
    },
    logout() {
      this.mnemonic = null
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.mnemonic !== null
    },
  }
})