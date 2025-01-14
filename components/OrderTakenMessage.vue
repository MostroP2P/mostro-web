<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Trade Started
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        {{ orderTakenMessage }}
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import CreatedAt from '~/components/CreatedAt.vue'
import { mapState } from 'pinia'
import { useOrders } from '~/stores/orders'
import type { MostroMessage } from '~/utils/mostro/types'
import { OrderType } from '~/utils/mostro/types'
export default {
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderById']),
    order() {
      return this.getOrderById(this.$route.params.id as string)
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
    creationDate() : number {
      return this.message.created_at * 1e3
    }
  }
}
</script>