<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Order taken
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      {{ messageText }}
    </v-list-item-subtitle>
    <v-list-item-subtitle class="d-flex justify-space-between">
      Please pay this invoice to start up your selling process, it will expire in 15 minutes
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
    return {
      showDialog: false,
      invoiceMode: 0,
      timeago
    }
  },
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  computed: {
    messageText() {
      // @ts-ignore
      return `Somebody wants to buy you ${this.satsAmount} sats for ${this.fiatCode} ${this.fiatAmount}`
    },
    satsAmount() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].amount
      }
    },
    fiatCode() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].fiat_code
      }
      return 'N/A'
    },
    fiatAmount() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].fiat_amount
      }
      return 'N/A'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>