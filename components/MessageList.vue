<template>
  <v-card class="d-flex" style="width: 100%;">
    <v-list lines="three">
      <div
        v-for="(message, index) in orderMessages"
        :key="`${message.order.id}-${index}`"
      >
        <message :message="message" :disabled="isCancelled"/>
        <v-divider v-if="index < orderMessages.length - 1"/>
      </div>
    </v-list>
  </v-card>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { Action, OrderStatus } from '~/stores/types'
import type { MostroMessage } from '~/stores/types'
import { useMessages } from '@/stores/messages'
import { useOrders } from '@/stores/orders'
export default {
  props: {
    orderId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(useMessages, ['getMostroMessagesByOrderId']),
    ...mapState(useOrders, ['getOrderStatus']),
    orderMessages() {
      const orderMsgs =  this.getMostroMessagesByOrderId(this.orderId)
        .filter((msg: MostroMessage) => msg.order.action !== Action.CantDo)
        .filter((msg: MostroMessage) => msg.order.action !== Action.RateReceived)
      return orderMsgs
    },
    isCancelled() {
      return this.getOrderStatus(this.orderId) === OrderStatus.CANCELED
    }
  }
}
</script>