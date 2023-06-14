import { EncryptedPrivateKey, ENCRYPTED_PRIVATE_KEY } from './types'

export enum AuthMethod {
  ENCRYPTED_NSEC,
  ALBY
}

export interface AuthState {
  authMethod: AuthMethod
  nsec: string | null,
  encryptedPrivateKey: EncryptedPrivateKey
}

export const state = () => {
  return {
    nsec: null,
    encryptedPrivKey: null
  }
}

export const actions = {
  nuxtClientInit({ commit }: { commit: Function }) {
    const encryptedPrivKey = localStorage.getItem(ENCRYPTED_PRIVATE_KEY);
    if(encryptedPrivKey) {
      commit('setEncryptedPrivateKey', JSON.parse(encryptedPrivKey));
    }
  },
  setKey(context: any, { nsec }: { nsec: string }) {
    const { commit } = context
    commit('setKey', nsec)
  },
  setEncryptedPrivateKey(
    { commit }: { commit: Function },
    encryptedPrivateKey: EncryptedPrivateKey
  ) {
    commit('setEncryptedPrivateKey', encryptedPrivateKey)
  },
  logout({ state, commit }: { state: AuthState, commit: Function}) {
    if (state.nsec) {
      commit('setKey', null)
    }
  }
}

export const mutations = {
  setKey(state: AuthState, nsec: string) {
    state.nsec = nsec
  },
  setEncryptedPrivateKey(state: AuthState, encryptedPrivateKey: EncryptedPrivateKey) {
    state.encryptedPrivateKey = encryptedPrivateKey
  }
}