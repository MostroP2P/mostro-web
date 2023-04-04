<template>
  <v-list-item-content>
    <v-list-item-title>Invoice Accepted</v-list-item-title>
    <v-list-item-subtitle>
      {{ getMessageText(message)}}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { Message } from '~/store/messages'

export default Vue.extend({
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  methods: {
    getMessageText(message: Message) {
      const details = `${this.buyerPubkey} has taken your order and wants to buy your sats. Get in touch and tell him/her how to send you ${this.fiatAmount} ${this.fiatCode} through ${this.paymentMethod}.`
      // @ts-ignore
      return `🧌 Order Id: ${this.orderId}\n\n` + details + 'Once you verify you have received the full amount you have to release the sats'
    }
  },
  computed: {
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
    }
  }
})
</script>