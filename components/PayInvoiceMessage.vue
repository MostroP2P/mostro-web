<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      You need to Pay
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      Somebody wants to buy you {{ satsAmount }} sats for {{ fiatCode?.toUpperCase() }} {{fiatAmount }}.
    </v-list-item-subtitle>
    <v-list-item-subtitle class="d-flex justify-space-between">
      Please press the button below to display a Lightning Network invoice and pay it to start up your selling process, it will expire in 15 minutes.
    </v-list-item-subtitle>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { MostroMessage } from '~/stores/types'
import * as timeago from 'timeago.js'
export default {
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
}
</script>