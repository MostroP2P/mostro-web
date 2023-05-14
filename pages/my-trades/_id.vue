<template>
  <v-container class="d-flex flex-column" style="min-height: 82vh">
    <div class="message-list-wrapper flex-grow-1">
      <message-list :order-id="$route.params.id"/>
    </div>
    <trade-actions></trade-actions>
    <v-stepper alt-labels class="mt-5">
      <v-stepper-header>
        <v-stepper-step step="1" :complete="isWaitingPayment">
          Waiting Payment
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="2" :complete="isActive">
          Invoice Accepted
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3" :complete="isFiatSent">
          Fiat Sent
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="4" :complete="isFundsReleased">
          Funds released
        </v-stepper-step>
      </v-stepper-header>
    </v-stepper>
    <div class="text-caption">
      {{ getOrderStatus($route.params.id) }}
    </div>
  </v-container>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import { OrderStatus } from '~/store/types'

const steps = {
  [`${OrderStatus.PENDING}`]: 0,
  [`${OrderStatus.WAITING_PAYMENT}`]: 1,
  [`${OrderStatus.ACTIVE}`]: 2,
  [`${OrderStatus.FIAT_SENT}`]: 3,
  [`${OrderStatus.SETTLE_HODL_INVOICE}`]: 4,
  [`${OrderStatus.SUCCESS}`]: 5
}
export default Vue.extend({
  layout: 'message-list',
  data() {
    return {
      // @ts-ignore
      OrderStatusConstant: OrderStatus
    }
  },
  computed: {
    ...mapState('orders', ['orders']),
    ...mapGetters('orders', ['getOrderStatus']),
    currentOrderStatus() {
      // @ts-ignore
      return this.getOrderStatus(this.$route.params.id)
    },
    isOrderTaken() {
      // @ts-ignore
      return steps[this.currentOrderStatus] >= steps[OrderStatus.PENDING] ?? 0
    },
    isWaitingPayment() {
      // @ts-ignore
      return steps[this.currentOrderStatus] >= steps[OrderStatus.WAITING_PAYMENT] ?? 0
    },
    isActive() {
      // @ts-ignore
      return steps[this.currentOrderStatus] >= steps[OrderStatus.ACTIVE] ?? 0
    },
    isFiatSent() {
      // @ts-ignore
      return steps[this.currentOrderStatus] >= steps[OrderStatus.FIAT_SENT] ?? 0
    },
    isFundsReleased() {
      // @ts-ignore
      return steps[this.currentOrderStatus] >= steps[OrderStatus.SUCCESS] ?? 0
    }
  }
})
</script>