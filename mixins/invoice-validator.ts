
export interface DecodedInvoice {
  paymentRequest: string
  sections: Section[]
  sectionsMap: Map<string, Section> | undefined
  expiry: number
  route_hints: any[]
  error?: string
}

export interface Section {
  name: string
  letters: string
  value?: string | number | CoinNetworkValue | FeatureBitsValue
  tag?: string
}

export interface CoinNetworkValue {
  bech32: string
  pubKeyHash: number
  scriptHash: number
  validWitnessVersions: number[]
}

export interface FeatureBitsValue {
  option_data_loss_protect: 'unsupported' | 'supported'
  initial_routing_sync: 'unsupported' | 'supported'
  option_upfront_shutdown_script: 'unsupported' | 'supported'
  gossip_queries: 'unsupported' | 'supported'
  var_onion_optin: 'unsupported' | 'supported'
  gossip_queries_ex: 'unsupported' | 'supported'
  option_static_remotekey: 'unsupported' | 'supported'
  payment_secret: 'unsupported' | 'required'
  basic_mpp: 'unsupported' | 'supported'
  option_support_large_channel: 'unsupported' | 'supported'
  extra_bits: ExtraBits
}

export interface ExtraBits {
  start_bit: number
  bits: number[]
  has_required: boolean
}

export default defineComponent({
  data() {
    return {
      requiredSatsAmount: null as number | null,
      decodedInvoice: null as DecodedInvoice | null,
      decodedInvoiceError: null as null | string,
      rules: {
        required: (value: string) => !!value || 'Enter a LN invoice',
        isInvoice: () => !!this.isInvoice || 'Not a valid LN invoice',
        network: () => !!this.isInvoiceNetwork || 'Wrong invoice network',
        value: () => !!this.isValueCorrect || this.wrongAmountErrorMessage,
        expired: () => !this.isExpired || 'Expired invoice'
      },
      isProduction: process.env.NODE_ENV === 'production'
    }
  },
  computed: {
    isInvoice(): boolean | string {
      if (!this.decodedInvoice) return false
      if (this.decodedInvoice.error) {
        let errorMsg = this.decodedInvoice.error
        const regex = /Invalid checksum in (.*): expected "(.*)"/
        const match = errorMsg.match(regex)
        if (match) {
          errorMsg = `Invalid checksum, expected: ${match[2]}`
        }
        return errorMsg
      }
      return this.decodedInvoice.paymentRequest !== undefined
    },
    isValueCorrect(): boolean {
      if (!this.decodedInvoice) return false
      if (!this.requiredSatsAmount) {
        return true
      }
      try {
        const sectionsMap = this.decodedInvoice.sectionsMap
        const amountSection = sectionsMap?.get('amount')
        if (!amountSection) return false
        const msats = amountSection.value as string
        const sats = parseInt(msats) / 1e3
        return sats === this.requiredSatsAmount
      } catch(err) {
        return false
      }
    },
    hasAmount(): boolean {
      if (!this.decodedInvoice) return false
      const sectionsMap = this.decodedInvoice.sectionsMap
      if (!sectionsMap) return false
      return sectionsMap?.has('amount')
    },
    isExpired() : boolean {
      if (!this.decodedInvoice) return false
      const sectionsMap = this.decodedInvoice.sectionsMap
      if (!sectionsMap) return false
      const expiresSection = sectionsMap.get('expiry')
      const timestampSection = sectionsMap.get('timestamp')
      if (!expiresSection || !timestampSection) {
        return true
      }
      const expires = expiresSection.value as number
      const timestamp = timestampSection.value as number
      const expirationTimesamp = timestamp + expires
      const now = Date.now() / 1E3
      return expirationTimesamp < now
    },
    isInvoiceNetwork() {
      if (this.isProduction) {
        // If this is production, we want to be a bit more
        // strict with the bolt11 invoice
        const sectionsMap = this.decodedInvoice?.sectionsMap
        if (!sectionsMap) return 'Could not find network'
        const networkSection = sectionsMap.get('coin_network')
        return networkSection?.letters === 'bc'
      } else {
        return true
      }
    },
    invoiceValueSats() {
      if (!this.decodedInvoice) return NaN
      const sectionsMap = this.decodedInvoice.sectionsMap
      const amountSection = sectionsMap?.get('amount')
      if (!amountSection) return NaN
      const msats = amountSection.value as string
      const sats = BigInt(msats) / BigInt(1e3)
      return Number(sats)
    }
  }
})
