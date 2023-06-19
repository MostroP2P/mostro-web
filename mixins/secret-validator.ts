import Vue from 'vue'

export enum PrivateKeyType {
  NSEC,
  HEX
}

interface PrivateKey {
  value: string | null,
  type: PrivateKeyType | null
}

interface DataType {
  privateKey: PrivateKey,
  rules: {
    [key: string]: Function
  }
}

function isValidHex(hex: string) {
  if (!hex || hex === '') return false
  try {
    const buffer = Buffer.from(hex, 'hex')
    return buffer !== undefined && buffer.length === 32
  } catch(err) {
    return false
  }
}

export default Vue.extend({
  data() : DataType {
    return {
      privateKey: {
        value: null,
        type: null
      },
      rules: {
        isNotEmpty: (value: string) => !!value || 'Enter a valid private key in nsec or hex format',
        isValidNsec: (value: string) => {
          if (typeof window !== 'undefined' && window.NostrTools) {
            const { nip19 } = window.NostrTools
            let decoded = null
            try {
              decoded = nip19.decode(value)
            } catch(err) {
              return false
            }
            return decoded && decoded.type && decoded.type === 'nsec'  
          }
          return false
        },
        isValidHex: (value: string) => isValidHex(value)
      }
    }
  }
})