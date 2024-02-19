<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      🤑 Payment received!
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        Now I need the buyer to send an invoice so I can send satoshis to his/her wallet. I will put you both in touch as soon as the buyer sends the invoice
      </p>
      <br>
      <p>
        Wait a bit. The collateral will be returned to you if the buyer does not cooperate.
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import type { MostroMessage } from '~/stores/types'
import CreatedAt from '~/components/CreatedAt.vue'
export default {
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>