<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ props }">
      <v-btn text color="accent" v-bind="props" prepend-icon="mdi-flash">
        <template v-slot:prepend>
          <v-icon color="success"></v-icon>
        </template>
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
        :rules="[rules.required, rules.isInvoice, rules.network, rules.value, !rules.expired]"
        :hint="invoiceHint"
      />
      <v-card-actions class="mx-3 mb-3">
        <v-btn color="warning" text @click="close" class="px-3">
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn :disabled="submitDisabled" color="success" text @click="submitInvoice" append-icon="mdi-send" class="px-3">
          Submit
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import * as bolt11 from 'light-bolt11-decoder'
import { MostroMessage } from '~/stores/types'

type InvoiceSection = {
  letters: string
  name: string
  value?: string | number | Object
}

type DecodedInvoice = {
  sections?: InvoiceSection[]
  expiry?: number
}

export default {
  data() {
    return {
      showDialog: false,
      invoice: '',
      decodedInvoice: {} as DecodedInvoice,
      isProcessing: false,
      rules: {
        required: (value: string) => !!value || 'Enter a LN invoice',
        // @ts-ignore
        isInvoice: () => true, //this.decodedInvoice.complete || 'Not a valid invoice',
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
        // @ts-ignore
        await this.$mostro.addInvoice(smallOrder, this.invoice)
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
        bolt11.decode(text)
        return true
      } catch(err) {
        return 'Not a valid invoice'
      }
    },
  },
  watch: {
    invoice(newValue) {
      this.decodedInvoice = {}
      if (!newValue) return
      try {
        this.decodedInvoice = bolt11.decode(newValue)
      } catch(err) {}
    }
  },
  computed: {
    invoiceHint() {
      return this.invoice === '' ? 'Enter a valid BOLT11 invoice' : ''
    },
    isValueCorrect() {
      let msat = 0
      try {
        const decoded = this.decodedInvoice
        // @ts-ignore
        const amountSection = decoded.sections.find(section => section.name === 'amount')
        if (amountSection !== undefined) {
          msat = parseInt(amountSection.value as string)
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
      // return this.decodedInvoice.timeExpireDate > Date.now() / 1e3
      let timestamp = 0
      const decoded = this.decodedInvoice
      if (decoded.expiry === undefined || decoded.sections === undefined) {
        return false
      }
      const timestampSection = decoded.sections.find(section => section.name === 'timestamp')
      if (timestampSection) {
        timestamp = timestampSection.value as number
      }
      const now = Math.round(Date.now() / 1e3)
      return timestamp + decoded.expiry < now
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
      return !this.isValueCorrect || this.isExpired
    }
  }
}
</script>