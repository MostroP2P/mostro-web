
export enum AuthMethod {
  ENCRYPTED_NSEC,
  ALBY
}

export interface AuthState {
  authMethod: AuthMethod
  nsec: string | null
}

export const state = () => ({
  nsec: null
})

export const actions = {
  setKey(context: any, { nsec }: { nsec: string }) {
    const { commit } = context
    commit('setKey', nsec)
  }
}

export const mutations = {
  setKey(state: AuthState, nsec: string) {
    state.nsec = nsec
  }
}