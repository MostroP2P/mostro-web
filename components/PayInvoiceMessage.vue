<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      You need to Pay
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message" v-if="isMaker">
      <p v-if="isMaker">
        Somebody wants to buy you {{ satsAmount }} sats for {{ fiatCode?.toUpperCase() }} {{fiatAmount }}.
      </p>
      <br>
      <p class="d-flex justify-space-between">
        Please press the button below to display a Lightning Network invoice and pay it to start up your selling process, it will expire in 15 minutes.
      </p>
    </div>
    <div class="wrap-text text-message" v-if="isTaker">
      <p>
        🧌 You took this selling order, please use a fiat payment processor that allows you to send the money immediately and in which there is no risk of freezing funds
      </p>
      <br>
      <p>
        If, for any reason, your payment processor puts the payment on pause and the funds do not arrive in less than 22 hours, the sats will return to the seller, putting the buyer at risk and I cannot force the seller to send the sats again.
      </p>
      <br>
      <p>
        If you agree with the above, press the button to continue 👇
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { mapState } from 'pinia'
import * as timeago from 'timeago.js'
import { useOrders } from '~/stores/orders'
import { MostroMessage } from '~/stores/types'

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
    ...mapState(useOrders, ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
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
    },
    isTaker() {
      return !this.order?.is_mine
    },
    isMaker() {
      return this.order?.is_mine
    }
  }
}
</script>