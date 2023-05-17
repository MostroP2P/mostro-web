<template>
  <v-list-item
    three-line
    link
  >
    <v-list-item-content @click="onOrderThreadHeaderClicked">
      <v-list-item-title>
        <div class="d-flex justify-space-between">
          {{ title }}
          <div class="text-caption text--disabled">{{ orderId }}</div>
        </div>
      </v-list-item-title>
      <v-list-item-subtitle class="text--secondary">
        {{ message }}
      </v-list-item-subtitle>
      <v-list-item-subtitle class="text--secondary">
        <div class="d-flex justify-space-between">
          <div class="d-flex align-top">
            <div class="mr-1 mb-0 pb-0">
              {{ messageCount }}
            </div>
            <icon-message/>
          </div>
          <div class="text-caption">{{ creationDate }}</div>
        </div>
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { ThreadSummary, OrderType } from '~/store/types'
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
    title() {
      const order = this.threadSummary.order
      if (order.is_mine) {
        if (this.orderType === OrderType.BUY) {
          return 'You are Buying'
        } else {
          return 'Your are Selling'
        }
      } else {
        if (this.orderType === OrderType.BUY) {
          return 'You are Selling'
        } else {
          return 'You are Buying'
        }
      }
    },
    message() {
      const { order } = this.threadSummary
      if (order.amount) {
        return `${order.amount} sats for ${order.fiat_amount} ${order.fiat_code.toUpperCase()}, via ${order.payment_method}`
      } else {
         return `${order.fiat_amount} ${order.fiat_code.toUpperCase()} for sats at market price, via ${order.payment_method}`
      }
    },
    creationDate() {
      const date = new Date(this.threadSummary.order.created_at * 1e3)
      return timeago.format(date)
    }
  },
  methods: {
    onOrderThreadHeaderClicked() {
      this.$router.push(`/my-trades/${this.threadSummary.order.id}`)
    }
  }
})
</script>