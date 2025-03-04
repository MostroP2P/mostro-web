import { watch } from 'vue'
import {
  AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC,
  AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC,
  AUTH_LOCAL_STORAGE_ENCRYPTED_NWC,
  AUTH_LOCAL_STORAGE_NWC_PASSWORD
} from './types'
import { useCrypto } from '~/composables/useCrypto'
import { useAuthStorage } from '~/composables/useAuthStorage'

export interface AuthState {
  encryptedMnemonic: string | null,
  mnemonic: string | null,
  encryptedNwc: string | null,
  nwc: string | null,
  nwcPassword: string | null
}

export const useAuth = defineStore('auth', {
  state: () => ({
    encryptedMnemonic: null as EncryptedData | null,
    mnemonic: null as string | null,
    encryptedNwc: null as EncryptedData | null,
    nwcPassword: null as string | null,
    isIndexedDBAvailable: false, // Default to false for SSR
    indexedDBError: null as string | null,
    isInitialized: false
  }),
  actions: {
    async nuxtClientInit() {
      // Skip if already initialized or if on server-side
      if (this.isInitialized || !import.meta.client) return

      const authStorage = useAuthStorage()

      // Check if IndexedDB is available
      this.isIndexedDBAvailable = authStorage.isIndexedDBAvailable()

      if (!this.isIndexedDBAvailable) {
        this.indexedDBError = 'IndexedDB is not available in this browser. For security reasons, you cannot use this application.'
        console.error(this.indexedDBError)
        this.isInitialized = true
        return
      }

      try {
        // Migrate any existing data from localStorage to IndexedDB
        await authStorage.migrateFromLocalStorage()

        // Load encrypted data from localStorage (this is still ok)
        const encryptedMnemonic = localStorage.getItem(AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC)
        if(encryptedMnemonic) {
          this.encryptedMnemonic = JSON.parse(encryptedMnemonic)
        }

        // Get mnemonic from IndexedDB
        const mnemonic = await authStorage.getValue(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
        if (mnemonic) {
          this.mnemonic = mnemonic
          const { $mostro } = useNuxtApp()
          $mostro.updateMnemonic(mnemonic)
        }

        // Load encrypted NWC from localStorage
        const encryptedNwc = localStorage.getItem(AUTH_LOCAL_STORAGE_ENCRYPTED_NWC)
        if(encryptedNwc) {
          this.encryptedNwc = JSON.parse(encryptedNwc)
        }

        // Get NWC password from IndexedDB
        const { generatePassword } = useCrypto()
        let nwcPassword = await authStorage.getValue(AUTH_LOCAL_STORAGE_NWC_PASSWORD)

        if (!nwcPassword) {
          nwcPassword = generatePassword()
          await authStorage.setValue(AUTH_LOCAL_STORAGE_NWC_PASSWORD, nwcPassword)
        }
        this.nwcPassword = nwcPassword

        // Set up watchers
        watch(() => this.encryptedMnemonic, (newEncryptedMnemonic) => {
          if (newEncryptedMnemonic && import.meta.client) {
            localStorage.setItem(AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC, JSON.stringify(newEncryptedMnemonic))
          }
        })

        watch(() => this.mnemonic, async (newMnemonic) => {
          if (newMnemonic && import.meta.client) {
            await authStorage.setValue(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC, newMnemonic)
          }
        })

        watch(() => this.encryptedNwc, (newEncryptedNwc) => {
          if (newEncryptedNwc && import.meta.client) {
            localStorage.setItem(AUTH_LOCAL_STORAGE_ENCRYPTED_NWC, JSON.stringify(newEncryptedNwc))
          }
        })

        this.isInitialized = true
      } catch (error) {
        console.error('Error initializing auth store:', error)
        this.indexedDBError = 'Error accessing secure storage. Please ensure your browser supports IndexedDB and is not in private/incognito mode.'
        this.delete()
        this.isInitialized = true
      }
    },
    async login(mnemonic: string) {
      if (!import.meta.client) {
        throw new Error('Cannot login on server-side')
      }

      if (!this.isIndexedDBAvailable) {
        throw new Error('IndexedDB is not available. For security reasons, you cannot log in.')
      }

      this.mnemonic = mnemonic

      const { $mostro } = useNuxtApp()
      $mostro.updateMnemonic(mnemonic)
    },
    setEncryptedMnemonic(encryptedMnemonic: EncryptedData) {
      this.encryptedMnemonic = encryptedMnemonic
    },
    setMnemonic(mnemonic: string) {
      if (!import.meta.client) {
        throw new Error('Cannot set mnemonic on server-side')
      }

      if (!this.isIndexedDBAvailable) {
        throw new Error('IndexedDB is not available. For security reasons, you cannot set mnemonic.')
      }

      this.mnemonic = mnemonic
    },
    async setNwc(nwc: string) {
      console.log('setNwc', nwc, ', encryption password', this.nwcPassword)
      if (!import.meta.client) {
        throw new Error('Cannot set NWC on server-side')
      }

      if (!this.isIndexedDBAvailable) {
        throw new Error('IndexedDB is not available. For security reasons, you cannot set NWC.')
      }

      const { encrypt } = useCrypto()
      if (!this.nwcPassword) {
        throw new Error('NWC password not available')
      }
      const encrypted = await encrypt(nwc, this.nwcPassword)
      this.encryptedNwc = encrypted
    },
    async delete() {
      this.logout()
      this.encryptedMnemonic = null
      this.mnemonic = null

      // Remove sensitive data from storage
      if (import.meta.client && this.isIndexedDBAvailable) {
        try {
          const authStorage = useAuthStorage()
          await authStorage.removeValue(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
        } catch (error) {
          console.error('Error removing data from IndexedDB:', error)
        }
      }

      // Always clean up localStorage
      if (import.meta.client) {
        localStorage.removeItem(AUTH_LOCAL_STORAGE_ENCRYPTED_MNEMONIC)
        localStorage.removeItem(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
      }
    },
    async deleteNwc() {
      this.encryptedNwc = null

      if (import.meta.client) {
        localStorage.removeItem(AUTH_LOCAL_STORAGE_ENCRYPTED_NWC)

        if (this.isIndexedDBAvailable) {
          try {
            // Generate a new NWC password for security
            const { generatePassword } = useCrypto()
            const newPassword = generatePassword()
            this.nwcPassword = newPassword

            const authStorage = useAuthStorage()
            await authStorage.setValue(AUTH_LOCAL_STORAGE_NWC_PASSWORD, newPassword)
          } catch (error) {
            console.error('Error updating NWC password in IndexedDB:', error)
          }
        }
      }
    },
    logout() {
      // Remove mnemonic from memory and decrypted mnemonic from IndexedDB
      this.mnemonic = null
      const authStorage = useAuthStorage()
      authStorage.removeValue(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.mnemonic !== null
    },
    hasNwc: (state) => state.encryptedNwc !== null,
    canUseApp: (state) => (import.meta.client && state.isIndexedDBAvailable && !state.indexedDBError) || !import.meta.client
  }
})