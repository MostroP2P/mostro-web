<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Needed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle class="wrap-text text-message">
      <p>
        🧌 You took this selling order, please use a fiat payment processor that allows you to send the money immediately and in which there is no risk of freezing funds.

        If, for any reason, your payment processor puts the payment on pause and the funds do not arrive in less than 22 hours, the sats will return to the seller, putting the buyer at risk and I cannot force the seller to send the sats again.

        If you agree with the above, press the button to continue 👇
      </p>
    </v-list-item-subtitle>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { MostroMessage } from '~/stores/types'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'

export default {
  data() {
    return {
      timeago
    }
  },
  mixins: [ textMessage ],
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    orderId() {
      return this.message.order_id
    },
    satsAmount() {
      return this.message.content.SmallOrder?.amount
    },
    sellerId() {
      return this.message.content.SmallOrder?.seller_pubkey
    },
    fiatAmount() {
      return this.message.content.SmallOrder?.fiat_amount
    },
    fiatCode() {
      return this.message.content.SmallOrder?.fiat_code
    },
    paymentMethod() {
      return this.message.content.SmallOrder?.payment_method
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>