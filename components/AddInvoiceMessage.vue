<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Needed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle class="wrap-text text-message">
      <p>
        We sent a hold invoice to the seller of order id : <strong>{{ orderId }}</strong> create a lightning invoice of {{ satsAmount }} sats to proceed.
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