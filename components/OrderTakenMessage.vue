<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Trade Started
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div>
      <p>
        {{ orderTakenMessage }}
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import { PropType } from 'vue'
import { mapState } from 'pinia'
import * as timeago from 'timeago.js'
import { useOrders } from '~/stores/orders'
import { MostroMessage, OrderType } from '~/stores/types'
export default {
  data() {
    return {
      timeago
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    orderTakenMessage() {
      if (!this.order) return 'Loading...'
      if (this.order.is_mine) {
        if (this.order.kind === OrderType.BUY) {
          return 'Your buy order was taken'
        } else {
          return 'Your sell order was taken'
        }
      } else {
        if (this.order.kind === OrderType.BUY) {
          return 'You just took a buy order'
        } else {
          return 'You just took a sell order'
        }
      }
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>