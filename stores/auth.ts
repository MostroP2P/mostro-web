import { EncryptedPrivateKey, ENCRYPTED_PRIVATE_KEY } from './types'

export const AUTH_LOCAL_STORAGE_KEY = 'encrypted-private-key'

export enum AuthMethod {
  LOCAL = 'local',
  NIP07 = 'nip-07',
  NOT_SET = 'not-set'
}

export interface LoginPayload {
  authMethod: AuthMethod,
  nsec?: string | null,
  publicKey?: string | null// Used only in case of NIP-07
}

export interface AuthState {
  authMethod: AuthMethod
  nsec: string | null,
  encryptedPrivateKey: EncryptedPrivateKey | null,
  publicKey?: string // Used only in case of NIP-07
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
      const encryptedPrivKey = localStorage.getItem(ENCRYPTED_PRIVATE_KEY)
      if(encryptedPrivKey) {
        this.encryptedPrivateKey = JSON.parse(encryptedPrivKey)
      }
    },
    login({ authMethod, nsec, publicKey } : LoginPayload) {
      this.authMethod = authMethod
      if (authMethod === AuthMethod.LOCAL) {
        this.nsec = nsec ?? null
      } else if (authMethod === AuthMethod.NIP07) {
        this.publicKey = publicKey
      }
    },
    setKey({ nsec }: { nsec: string }) {
      this.nsec = nsec
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
      this.authMethod = AuthMethod.NOT_SET
    }
  },
  getters: {
    isLocked(state) {
      switch(state.authMethod) {
        case AuthMethod.LOCAL:
          return !state.nsec
        case AuthMethod.NIP07:
          return !state.publicKey
      }
      return true
    }
  }
})