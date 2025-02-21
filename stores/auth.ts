import { watch } from 'vue'
import { AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC, AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC } from './types'
import { nip19 } from 'nostr-tools'

export interface AuthState {
  encryptedMnemonic: string | null,
  mnemonic: string | null,
  encryptedNwc: string | null,
  nwc: string | null
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
    encryptedMnemonic: null as EncryptedData | null,
    mnemonic: null as string | null,
    encryptedNwc: null as EncryptedData | null,
    nwc: null as string | null,
    _password: null as string | null
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
    setPassword(password: string) {
      this._password = password
    },
    async setNwc(nwc: string) {
      if (!this._password) {
        throw new Error('Password not available')
      }
      const { encrypt } = useCrypto()
      const encrypted = await encrypt(nwc, this._password)
      this.encryptedNwc = encrypted
    },
    async decryptNwc() {
      if (!this.encryptedNwc) return
      if (!this._password) {
        throw new Error('Password not available')
      }
      try {
        const { decrypt } = useCrypto()
        this.nwc = await decrypt(this.encryptedNwc, this._password)
      } catch (error) {
        console.error('Failed to decrypt NWC:', error)
        throw error
      }
    },
    delete() {
      this.logout()
      this.encryptedMnemonic = null
      this.mnemonic = null
    },
    deleteNwc() {
      this.encryptedNwc = null
      this.nwc = null
      localStorage.removeItem('AUTH_LOCAL_STORAGE_ENCRYPTED_NWC')
    },
    logout() {
      this.mnemonic = null
      this.nwc = null
      this._password = null
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.mnemonic !== null
    },
    hasNwc: (state) => state.encryptedNwc !== null
  }
})