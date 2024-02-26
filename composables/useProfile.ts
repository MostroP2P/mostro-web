import type { Nostr } from "~/plugins/01-nostr"

export type Profile = {
  image: string | undefined
  username: string | undefined
}

// Map of npub to avatar url
const profileMap = new Map<string, Profile>()

export function useProfile() {
  const getProfile = async (npub: string) => {
    if (profileMap.has(npub)) return profileMap.get(npub)
    const nuxt = useNuxtApp()
    const $nostr: Nostr = nuxt.$nostr as Nostr
    if ($nostr) {
      try {
        const userProfileResp = await $nostr.fetchProfile({ npub })
        if (userProfileResp) {
          const { image, username } = userProfileResp
          const profile: Profile = { image, username}
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

