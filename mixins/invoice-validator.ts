import Vue from 'vue'
import lightningPayReq from 'bolt11'

type DecodedInvoice = {
  complete: boolean,
  millisatoshis: string,
  satoshis: number
}

export default Vue.extend({
  data() {
    return {
      decodedInvoice: {} as DecodedInvoice,
      rules: {
        required: (value: string) => !!value || 'Enter a LN invoice',
        // @ts-ignore
        isInvoice: () => this.decodedInvoice.complete || 'Not a valid invoice',
        // @ts-ignore
        network: () => this.isInvoiceNetwork || 'Wrong invoice network',
        // @ts-ignore
        value: () => this.isValueCorrect || this.wrongAmountErrorMessage,
        // @ts-ignore
        expired: () => this.isExpired || 'Expired invoice'
      }
    }
  },
  methods: {
    isInvoice(text: string) {
      try {
        lightningPayReq.decode(text)
        return true
      } catch(err) {
        return 'Not a valid invoice'
      }
    },
  },
  computed: {
    isValueCorrect() {
      // @ts-ignore
      if (!this.requiredSatsAmount) {
        // If a required amount has not been specified,
        // we just return true to this check 
        return true
      }
      let msat = 0
      try {
        const decoded = this.decodedInvoice
        if (decoded) {
          // @ts-ignore
          if (decoded.satoshis) {
            // @ts-ignore
            msat = decoded.satoshis * 1e3
            // @ts-ignore
          } else if (decoded.millisatoshis !== null && decoded.millisatoshis !== undefined) {
            // @ts-ignore
            msat = parseInt(decoded.millisatoshis)
          }
        }
        // @ts-ignore
        const requiredMsat = this.requiredSatsAmount * 1e3
        return msat !== 0 && msat === requiredMsat
      } catch(err) {
        return false
      }
    },
    isExpired() {
      // @ts-ignore
      return this.decodedInvoice.timeExpireDate > Date.now() / 1e3
    },
    isInvoiceNetwork() {
      // TODO: This should be 'bcrt' in dev mode and 'bc' in production
      return true
    },
    invoiceValueSats() {
      let amount = NaN
      if (this.decodedInvoice?.complete) {
        const decoded: DecodedInvoice = this.decodedInvoice
        if (decoded?.satoshis) {
          amount = decoded.satoshis
        } else if (decoded?.millisatoshis && decoded?.millisatoshis) {
          amount = Math.floor(parseInt(decoded.millisatoshis) / 1e3)
        }
      }
      return amount
    }
  }
})