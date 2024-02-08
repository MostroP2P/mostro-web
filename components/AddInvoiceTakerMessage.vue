<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between mb-2">
      Invoice Needed
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        🧌 You took this selling order, please use a fiat payment processor that allows you to send the money immediately and in which there is no risk of freezing funds.
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
import type { MostroMessage } from '~/stores/types'

import textMessage from '~/mixins/text-message'

export default {
  mixins: [ textMessage ],
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    orderId() {
      return this.message.Order.id
    },
    satsAmount() {
      return this.message.Order.content.SmallOrder?.amount
    },
    sellerId() {
      return this.message.Order.content.SmallOrder?.seller_pubkey
    },
    fiatAmount() {
      return this.message.Order.content.SmallOrder?.fiat_amount
    },
    fiatCode() {
      return this.message.Order.content.SmallOrder?.fiat_code
    },
    paymentMethod() {
      return this.message.Order.content.SmallOrder?.payment_method
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>