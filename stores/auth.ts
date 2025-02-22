import { watch } from 'vue'
import { AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC, AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC } from './types'
import { nip19 } from 'nostr-tools'

export interface AuthState {
  encryptedMnemonic: string | null,
  mnemonic: string | null,
  encryptedNwc: string | null,
  nwc: string | null,
  nwcPassword: string | null
}

export function isNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec)
    return decoded.type === 'nsec'
  } catch (error) {
    return false
  }
}

function generatePassword() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const useAuth = defineStore('auth', {
  state: () => ({
    encryptedMnemonic: null as EncryptedData | null,
    mnemonic: null as string | null,
    encryptedNwc: null as EncryptedData | null,
    nwcPassword: null as string | null
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
      const encryptedNwc = localStorage.getItem('AUTH_LOCAL_STORAGE_ENCRYPTED_NWC')
      if(encryptedNwc) {
        this.encryptedNwc = JSON.parse(encryptedNwc)
      }
      let nwcPassword = localStorage.getItem('AUTH_LOCAL_STORAGE_NWC_PASSWORD')
      if (!nwcPassword) {
        nwcPassword = generatePassword()
        localStorage.setItem('AUTH_LOCAL_STORAGE_NWC_PASSWORD', nwcPassword)
      }
      this.nwcPassword = nwcPassword
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
      watch(() => this.encryptedNwc, (newEncryptedNwc) => {
        if (newEncryptedNwc) {
          localStorage.setItem('AUTH_LOCAL_STORAGE_ENCRYPTED_NWC', JSON.stringify(newEncryptedNwc))
        }
      })
    },
    login(mnemonic: string) {
      this.mnemonic = mnemonic

      // Initialize KeyManager
      const keyManager = new KeyManager()
      keyManager.init(this.mnemonic)
    },
    setEncryptedMnemonic(encryptedMnemonic: EncryptedData) {
      this.encryptedMnemonic = encryptedMnemonic
    },
    setMnemonic(mnemonic: string) {
      this.mnemonic = mnemonic
    },
    async setNwc(nwc: string) {
      const { encrypt } = useCrypto()
      if (!this.nwcPassword) {
        throw new Error('NWC password not available')
      }
      const encrypted = await encrypt(nwc, this.nwcPassword)
      this.encryptedNwc = encrypted
    },
    delete() {
      this.logout()
      this.encryptedMnemonic = null
      this.mnemonic = null
    },
    deleteNwc() {
      this.encryptedNwc = null
      localStorage.removeItem('AUTH_LOCAL_STORAGE_ENCRYPTED_NWC')
    },
    logout() {
      this.mnemonic = null
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.mnemonic !== null
    },
    hasNwc: (state) => state.encryptedNwc !== null
  }
})