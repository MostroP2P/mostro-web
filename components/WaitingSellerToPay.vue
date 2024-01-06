<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Waiting Seller to Pay
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>    
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        I have sent a payment request to the seller so he sends your sats for the order Id: <strong>{{ orderId }}</strong>, as soon as payment is made I will put you both in touch.
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import type { MostroMessage } from '~/stores/types'
import textMessage from '~/mixins/text-message'

export default {
  data() {
    return { timeago }
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
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>