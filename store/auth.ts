import { EncryptedPrivateKey, ENCRYPTED_PRIVATE_KEY, RootState } from './types'

export enum AuthMethod {
  LOCAL = 'local',
  NIP07 = 'nip-07',
  NOT_SET = 'not-set'
}

export interface LoginPayload {
  authMethod: AuthMethod,
  nsec?: string,
  publicKey?: string // Used only in case of NIP-07
}

export interface AuthState {
  authMethod: AuthMethod
  nsec: string | null,
  encryptedPrivateKey: EncryptedPrivateKey,
  publicKey?: string // Used only in case of NIP-07
}

export const state = () => {
  return {
    authMethod: AuthMethod.NOT_SET,
    nsec: null,
    encryptedPrivKey: null,
    publicKey: null
  }
}

export const actions = {
  nuxtClientInit({ commit }: { commit: Function }) {
    const encryptedPrivKey = localStorage.getItem(ENCRYPTED_PRIVATE_KEY);
    if(encryptedPrivKey) {
      commit('setEncryptedPrivateKey', JSON.parse(encryptedPrivKey));
    }
  },
  login(context: any, { authMethod, nsec, publicKey } : LoginPayload) {
    const { commit } = context
    commit('setAuthMethod', authMethod)
    if (authMethod === AuthMethod.LOCAL) {
      commit('setPrivateKey', nsec)
    } else if (authMethod === AuthMethod.NIP07) {
      commit('setPublicKey', publicKey)
    }
  },
  setKey(context: any, { nsec }: { nsec: string }) {
    const { commit } = context
    commit('setPrivateKey', nsec)
  },
  setEncryptedPrivateKey(
    { commit }: { commit: Function },
    encryptedPrivateKey: EncryptedPrivateKey
  ) {
    commit('setEncryptedPrivateKey', encryptedPrivateKey)
  },
  logout({ state, commit }: { state: AuthState, commit: Function}) {
    if (state.nsec) {
      commit('setPrivateKey', undefined)
    }
    if (state.authMethod === AuthMethod.NIP07) {
      commit('setAuthMethod', AuthMethod.NOT_SET)
      commit('setPublicKey', null)
    }
  }
}

export const mutations = {
  setPrivateKey(state: AuthState, nsec: string) {
    state.nsec = nsec
  },
  setPublicKey(state: AuthState, publicKey: string) {
    state.publicKey = publicKey
  },
  setEncryptedPrivateKey(state: AuthState, encryptedPrivateKey: EncryptedPrivateKey) {
    state.encryptedPrivateKey = encryptedPrivateKey
  },
  setAuthMethod(state: AuthState, authMethod: AuthMethod) {
    state.authMethod = authMethod
  }
}

export const getters = {
  isLocked(state: AuthState) {
    switch(state.authMethod) {
      case AuthMethod.LOCAL:
        return !state.nsec
      case AuthMethod.NIP07:
        return !state.publicKey
    }
    return true
  }
}