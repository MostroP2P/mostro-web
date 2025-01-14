import type { Mostro } from '~/utils/mostro'

export type Profile = {
  image: string | undefined
  username: string | undefined
}

// Map of npub to avatar url
const profileMap = new Map<string, Profile>()

export function useProfile() {
  const getProfile = async (npub: string) => {
    if (!npub) {
      console.warn('No npub provided')
      return null
    }
    if (profileMap.has(npub)) return profileMap.get(npub)
    const nuxt = useNuxtApp()
    const $mostro: Mostro = nuxt.$mostro as Mostro
    const $nostr = $mostro.getNostr()
    if ($nostr) {
      try {
        const userProfileResp = await $nostr.fetchProfile({ npub })
        if (userProfileResp) {
          const { image, displayName } = userProfileResp
          const profile: Profile = { image, username: displayName }
          profileMap.set(npub, profile)  
        }
      } catch(err) {
        console.error('Error trying to fetch avatar: ', err)
      }
    }
    return profileMap.get(npub)
  }

  return { getProfile }
}

