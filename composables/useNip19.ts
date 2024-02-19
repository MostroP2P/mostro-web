import { nip19 } from 'nostr-tools'

export function useNip19 () {
  const isNsec = (value: string) => {
    try {
      const decoded = nip19.decode(value)
      return decoded.type === 'nsec'
    } catch (error) {
      return false
    }
  }
  const nsecToHex = (nsec: string) : string => {
    return nip19.decode(nsec).data as string
  }
  return { isNsec, nsecToHex }
}