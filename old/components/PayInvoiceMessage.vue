<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      You need to Pay
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      You're selling {{ satsAmount }} sats for {{ fiatCode?.toUpperCase() }} {{fiatAmount }}.
    </v-list-item-subtitle>
    <v-list-item-subtitle class="d-flex justify-space-between">
      Please press the button below to display a Lightning Network invoice and pay it to proceed. Your payment will be held in escrow. You have 15 minutes before this order expires.
    </v-list-item-subtitle>
  </v-list-item-content>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { MostroMessage } from '~/store/types'
import * as timeago from 'timeago.js'
export default Vue.extend({
  data() {
    return {
      timeago
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    messageText() {
      // @ts-ignore
      return `You're selling ${this.satsAmount} sats for ${this.fiatCode} ${this.fiatAmount}`
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