<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn text color="accent" v-bind="attrs" v-on="on">
        <v-icon left>
          fa-sharp fa-solid fa-bolt
        </v-icon>
        Enter Invoice
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-title">
        Buyer Action Required
      </v-card-title>
      <v-card-text>
        Please give us an invoice for <strong>{{ satsAmount }}</strong> sats.
      </v-card-text>
      <v-textarea
        v-model="invoice"
        rows="7"
        outlined
        class="mx-5"
        :rules="[rules.required, rules.isInvoice, rules.network, rules.value, rules.expired]"
        :hint="hint"
      />
      <v-card-actions>
        <v-btn color="warning" text @click="close">
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn :disabled="submitDisabled" color="primary" text @click="submitInvoice">
          Submit
          <v-icon right small>
            mdi-send mdi-rotate-315
          </v-icon>
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import lightningPayReq from 'bolt11'
import { MostroMessage } from '~/store/types'
export default Vue.extend({
  data() {
    return {
      showDialog: false,
      invoice: '',
      decodedInvoice: {},
      isProcessing: false,
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
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  methods: {
    async submitInvoice() {
      // @ts-ignore
      const smallOrder = this.message.content.SmallOrder
      try {
        // Obs: We issue these two messages because this component can be used either
        // when the buyer is  the taker or maker, and the protocol expects 2 different
        // messages each time.
        // Since we're not tracking orders locally and because mostro has not
        // yet given us the npubs of seller & buyer at this point it's not possible
        // for us to differentiate which situation we're in, so we're going with
        // this "hackish" way instead.
        // @ts-ignore
        this.$mostro.takeSell(smallOrder, this.invoice)
        // @ts-ignore
        this.$mostro.addInvoice(smallOrder, this.invoice)
      } catch(err) {
        console.error('Error while giving invoice for buy order: ', err)
      } finally {
        this.isProcessing = false
        this.invoice = ''
        this.showDialog = false
      }
    },
    close() {
      this.decodedInvoice = {}
      this.invoice = '',
      this.showDialog = false
    },
    isInvoice(text: string) {
      try {
        lightningPayReq.decode(text)
        return true
      } catch(err) {
        return 'Not a valid invoice'
      }
    },
  },
  watch: {
    invoice(newValue) {
      this.decodedInvoice = {}
      try {
        this.decodedInvoice = lightningPayReq.decode(newValue)
      } catch(err) {}
    }
  },
  computed: {
    hint() {
      return this.invoice === '' ? 'Enter a valid BOLT11 invoice' : ''
    },
    isValueCorrect() {
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
        const requiredMsat = this.satsAmount * 1e3
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
    satsAmount() {
      return this.message.content.SmallOrder?.amount ?? '?'
    },
    wrongAmountErrorMessage() {
      // @ts-ignore
      return `Invalid amount, please provide us with ${this.satsAmount} sats`
    },
    submitDisabled() {
      let decodeError = false
      let decoded: {satoshis: number, millisatoshis: number } | undefined
      let amount
      try {
        // @ts-ignore
        decoded = this.decodedInvoice
        if (decoded?.satoshis) {
          amount = decoded.satoshis
        } else if (decoded?.millisatoshis && decoded?.millisatoshis) {
          // @ts-ignore
          amount = Math.floor(decoded.millisatoshis / 1e3)
        }
      } catch(err) {
        decodeError = true
      }
      return this.invoice.length === 0 || decodeError || !amount
    }
  }
})
</script>