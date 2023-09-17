<template>
  <v-card class="mx-auto d-flex">
    <v-list lines="three">
      <div
        v-for="(message, index) in orderMessages"
        :key="`${message.id}-${index}`"
      >
        <message :message="message" :disabled="isCancelled"/>
        <v-divider v-if="index < orderMessages.length - 1"/>
      </div>
    </v-list>
  </v-card>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { Action, MostroMessage, OrderStatus } from '~/stores/types'
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
      // @ts-ignore
      return this.getMostroMessagesByOrderId(this.orderId)
        .filter((msg: MostroMessage) => msg.action !== Action.CantDo)
    },
    isCancelled() {
      return this.getOrderStatus(this.orderId) === OrderStatus.CANCELED
    }
  }
}
</script>