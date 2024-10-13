import { watch } from 'vue'
import { AUTH_LOCAL_STORAGE_ENCRYPTED_KEY, AUTH_LOCAL_STORAGE_DECRYPTED_KEY } from './types'
import type { EncryptedPrivateKey } from './types'
import { nip19, getPublicKey } from 'nostr-tools'

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
  encryptedPrivateKey: EncryptedPrivateKey | null,
  pubKey: string | null,
  privKey: string | null
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
    authMethod: AuthMethod.NOT_SET,
    encryptedPrivateKey: null as EncryptedPrivateKey | null,
    pubKey: null as string | null,
    privKey: null as string | null
  }),
  actions: {
    nuxtClientInit() {
      const encryptedPrivKey = localStorage.getItem(AUTH_LOCAL_STORAGE_ENCRYPTED_KEY)
      if(encryptedPrivKey) {
        this.encryptedPrivateKey = JSON.parse(encryptedPrivKey)
      }
      const decryptedPrivKey = ref<string | null>(localStorage.getItem(AUTH_LOCAL_STORAGE_DECRYPTED_KEY))
      if (decryptedPrivKey.value) {
        try {
          this.privKey = decryptedPrivKey.value
          this.pubKey = getPublicKey(Buffer.from(this.privKey, 'hex'))
          this.authMethod = AuthMethod.LOCAL
        } catch(err) {
          console.warn('Error setting local key from local storage: ', err)
          this.delete()
        }
      }
      watch(() => this.encryptedPrivateKey, (newVal) => {
        localStorage.setItem(AUTH_LOCAL_STORAGE_ENCRYPTED_KEY, JSON.stringify(newVal))
      })
      watch(() => this.privKey, (newVal) => {
        localStorage.setItem(AUTH_LOCAL_STORAGE_DECRYPTED_KEY, newVal || '')
      })
    },
    login(loginPayload: LoginPayload) {
      this.authMethod = loginPayload.authMethod
      if (loginPayload.authMethod === AuthMethod.LOCAL) {
        const localLoginPayload = loginPayload as LocalLoginPayload
        const { privateKey } = localLoginPayload
        if (isNsec(privateKey)) {
          const decoded = nip19.decode(privateKey)
          this.privKey = decoded.data as string
        } else {
          this.privKey = privateKey
        }
        this.pubKey = getPublicKey(Buffer.from(this.privKey, 'hex'))
      } else if (this.authMethod === AuthMethod.NIP07) {
        const extensionLoginPayload = loginPayload as ExtensionLoginPayload
        this.pubKey = extensionLoginPayload.publicKey
      }
    },
    setEncryptedPrivateKey(encryptedPrivateKey: EncryptedPrivateKey | null) {
      this.encryptedPrivateKey = encryptedPrivateKey
    },
    delete() {
      this.logout()
      this.encryptedPrivateKey = null
    },
    logout() {
      this.privKey = null
      this.pubKey = null
      localStorage.removeItem(AUTH_LOCAL_STORAGE_DECRYPTED_KEY)
      this.authMethod = AuthMethod.NOT_SET
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.authMethod !== AuthMethod.NOT_SET
    },
  }
})