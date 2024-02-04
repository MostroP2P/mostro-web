import { reactive } from 'vue'
import { nip19 } from 'nostr-tools'

export enum PrivateKeyType {
  NSEC,
  HEX,
}

function isValidHex(hex: string) {
  if (!hex || hex === '') return false
  try {
    const buffer = Buffer.from(hex, 'hex')
    return buffer !== undefined && buffer.length === 32
  } catch (err) {
    return false
  }
}

export function useSecretValidator() {
  const privateKey = reactive({
    value: null,
    type: null,
  })

  const rules = {
    isNotEmpty: (value: string) => !!value || 'Enter a valid private key in nsec or hex format',
    isValidNsec: (value: string) => {
      if (typeof window !== 'undefined') {
        let decoded = null
        try {
          decoded = nip19.decode(value)
        } catch (err) {
          return false
        }
        return decoded && decoded.type && decoded.type === 'nsec'
      }
      return false
    },
    isValidHex: (value: string) => isValidHex(value),
  }

  return {
    privateKey,
    rules,
  }
}