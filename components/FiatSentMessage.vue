<template>
  <div>
    <v-list-item-content>
      <v-list-item-title class="d-flex justify-space-between">
        Fiat Sent
        <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ buyerPubkey }} has informed that already sent you the fiat money, once you confirmed you received it, please release funds. You will not be able to create another order until you release funds.
      </v-list-item-subtitle>
    </v-list-item-content>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import { Message } from '~/store/messages'
export default Vue.extend({
  data() {
    return { timeago }
  },
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  computed: {
    buyerPubkey() {
      const fiatSent = this.message.content.FiatSent
      if (fiatSent) {
        return fiatSent.buyer
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>