<template>
  <v-list-item
    three-line
    link
  >
    <v-list-item-content>
      <v-list-item-title>
        <div class="d-flex justify-space-between">
          {{ orderType }} Order
          <div class="text-caption text--disabled">{{ orderId }}</div>
        </div>
      </v-list-item-title>
      <v-list-item-subtitle class="text--secondary">
        {{ message }}
      </v-list-item-subtitle>
      <v-list-item-subtitle class="text--secondary">
        <div class="d-flex justify-space-between">
          <div>{{ messageCount }} message{{ messageCount > 1 ? 's' : ''}}</div>
          <div class="text-caption">{{ creationDate }}</div>
        </div>
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { ThreadSummary } from '~/store/types'
import * as timeago from 'timeago.js'
export default Vue.extend({
  props: {
    threadSummary: {
      type: Object as PropType<ThreadSummary>,
      required: true
    }
  },
  computed: {
    orderType() {
      return this.threadSummary.order.kind
    },
    orderId() {
      return this.threadSummary.order.id
    },
    messageCount() {
      return this.threadSummary.messageCount
    },
    message() {
      const { order } = this.threadSummary
      let operation = ''
      if (this.orderType === 'Sell') {
        operation = 'Selling'
      } else {
        operation = 'Buying'
      }
      return `${operation} ${order.amount} sats for ${order.fiat_amount} ${order.fiat_code}, ${order.payment_method}`
    },
    creationDate() {
      const date = new Date(this.threadSummary.order.created_at * 1e3)
      return timeago.format(date)
    }
  }
})
</script>