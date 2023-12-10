import { EncryptedPrivateKey, AUTH_LOCAL_STORAGE_ENCRYPTED_KEY, AUTH_LOCAL_STORAGE_DECRYPTED_KEY } from './types'
import { useLocalStorage } from '@vueuse/core'
import { nip19 } from 'nostr-tools'

export enum AuthMethod {
  LOCAL = 'local',
  NIP07 = 'nip-07',
  NOT_SET = 'not-set'
}

export interface ExtensionLoginPayload {
  authMethod: AuthMethod,
  publicKey: string
}

export interface LocalLoginPayload {
  authMethod: AuthMethod,
  privateKey: string
}

export type LoginPayload = ExtensionLoginPayload | LocalLoginPayload

export interface AuthState {
  authMethod: AuthMethod
  nsec: string | null,
  encryptedPrivateKey: EncryptedPrivateKey | null,
  publicKey?: string // Used only in case of NIP-07
}

function isNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec)
    return decoded.type === 'nsec'
  } catch (error) {
    return false
  }
}

export const useAuth = defineStore('auth', {
  state: () => ({
    authMethod: AuthMethod.NOT_SET,
    nsec: null as string | null,
    encryptedPrivateKey: null as EncryptedPrivateKey | null,
    publicKey: null as string | null | undefined
  }),
  actions: {
    nuxtClientInit() {
      const encryptedPrivKey = localStorage.getItem(AUTH_LOCAL_STORAGE_ENCRYPTED_KEY)
      if(encryptedPrivKey) {
        this.encryptedPrivateKey = JSON.parse(encryptedPrivKey)
      }
      const decryptedPrivKey = useLocalStorage(AUTH_LOCAL_STORAGE_DECRYPTED_KEY, '')
      if (decryptedPrivKey) {
        this.setKey({ privateKey: decryptedPrivKey.value })
        this.authMethod = AuthMethod.LOCAL
      }
    },
    login(loginPayload: LoginPayload) {
      this.authMethod = loginPayload.authMethod
      if (loginPayload.authMethod === AuthMethod.LOCAL) {
        const localLoginPayload = loginPayload as LocalLoginPayload
        this.setKey({ privateKey: localLoginPayload.privateKey })
      } else if (this.authMethod === AuthMethod.NIP07) {
        const extensionLoginPayload = loginPayload as ExtensionLoginPayload
        this.publicKey = extensionLoginPayload.publicKey
      }
    },
    setKey({ privateKey }: { privateKey: string }) {
      if (!privateKey) return
      if (isNsec(privateKey)) {
        this.nsec = privateKey
      } else {
        try {
          const encoded = nip19.nsecEncode(privateKey)
          this.nsec = encoded
        } catch (err) {
          console.error('Error decoding private key to nip-19: ', err)
        }
      }
    },
    setEncryptedPrivateKey(encryptedPrivateKey: EncryptedPrivateKey | null) {
      this.encryptedPrivateKey = encryptedPrivateKey
    },
    logout() {
      if (this.nsec) {
        this.nsec = null
      }
      if (this.authMethod === AuthMethod.NIP07) {
        this.publicKey = null
      }
      const decryptedPrivKey = useLocalStorage(AUTH_LOCAL_STORAGE_DECRYPTED_KEY, '')
      if (decryptedPrivKey) {
        decryptedPrivKey.value = ''
      }
      this.authMethod = AuthMethod.NOT_SET
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.authMethod !== AuthMethod.NOT_SET &&
      (state.nsec !== null || state.publicKey !== null)
    },
  }
})