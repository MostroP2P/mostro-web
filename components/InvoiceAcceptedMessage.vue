<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Accepted
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      {{ getMessageText }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { Message } from '~/store/messages'
import * as timeago from 'timeago.js'

export default Vue.extend({
  data() {
    return { timeago }
  },
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  computed: {
    getMessageText() {
      // @ts-ignore
      const details = `The user ${this.buyerPubkey} has taken your order and wants to buy your sats. Get in touch and tell him/her how to send you ${this.fiatAmount} ${this.fiatCode} through ${this.paymentMethod}.\n\n`
      const finalInstructions = 'Once you verify you have received the full amount you have to release the sats'
      return details + finalInstructions
    },
    fiatAmount() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.fiatAmount
      }
      return NaN
    },
    fiatCode() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.fiatCode
      }
      return NaN
    },
    paymentMethod() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.paymentMethod
      }
      return NaN
    },
    buyerPubkey() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.buyer
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>