<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Needed
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        🧌 Someone took your order and already sent me the sats, please use a fiat payment processor that allows you to send the money immediately and in which there is no risk of freezing funds.
      </p>
      <br>
      <p>
        If, for any reason, your payment processor puts the payment on pause and the funds do not arrive in less than 22 hours, the sats will return to the seller, putting the buyer at risk. I cannot force the seller to send the sats again.
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
import type { MostroMessage } from '~/utils/mostro/types'
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
      return this.message.order?.id
    },
    satsAmount() {
      return this.message.order?.payload?.small_order?.amount
    },
    sellerId() {
      return this.message.order?.payload?.small_order?.seller_pubkey
    },
    fiatAmount() {
      return this.message.order?.payload?.small_order?.fiat_amount
    },
    fiatCode() {
      return this.message.order?.payload?.small_order?.fiat_code
    },
    paymentMethod() {
      return this.message.order?.payload?.small_order?.payment_method
    },
    creationDate() {
      return this.message?.created_at ? this.message.created_at * 1e3 : '??'
    }
  }
}
</script>