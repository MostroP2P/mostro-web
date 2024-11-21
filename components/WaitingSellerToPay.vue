<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Waiting Seller to Pay
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>    
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
import CreatedAt from '~/components/CreatedAt.vue'
import type { MostroMessage } from '~/utils/mostro/types'
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
      return this.message.order.id
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>