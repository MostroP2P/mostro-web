<template>
  <v-container class="d-flex flex-column" style="min-height: 82vh">
    <div class="message-list-wrapper flex-grow-1">
      <message-list :order-id="$route.params.id"/>
    </div>
    <div class="d-flex justify-center align-center mt-5">
      <pay-invoice-button
        v-if="orderStatus === OrderStatusConstant.WaitingPayment && payInvoiceMessage"
        :message="payInvoiceMessage"
      />
      <div v-if="orderStatus === OrderStatusConstant.FIAT_SENT || orderStatus === OrderStatusConstant.ACTIVE">
        <v-btn text color="warning">
          <v-icon left>mdi-alert-outline</v-icon>
          Dispute
        </v-btn>
        <release-funds-dialog/>
      </div>
    </div>
    <v-stepper alt-labels class="mt-5">
      <v-stepper-header>
        <v-stepper-step step="1" :complete="isWaitingPayment">
          Waiting Payment
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="2" :complete="isWaitingPayment">
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
import { mapGetters } from 'vuex'
import { OrderStatus } from '~/store/orders'

const steps = {
  [`${OrderStatus.PENDING}`]: 0,
  [`${OrderStatus.WAITING_PAYMENT}`]: 1,
  [`${OrderStatus.ACTIVE}`]: 2,
  [`${OrderStatus.FIAT_SENT}`]: 3,
  [`${OrderStatus.SUCCESS}`]: 4
}
export default Vue.extend({
  layout: 'message-list',
  data() : { orderStatus: OrderStatus } {
    return {
      orderStatus: OrderStatus.PENDING,
      // @ts-ignore
      OrderStatusConstant: OrderStatus
    }
  },
  mounted() {
    // @ts-ignore
    this.orderStatus = this.getOrderStatus(this.$route.params.id)
    console.log('payInvoiceMessage: ', this.payInvoiceMessage)
  },
  computed: {
    ...mapGetters('orders', ['getOrderStatus']),
    ...mapGetters('messages', ['getMessagesByOrderId']),
    payInvoiceMessage() {
      const orderId = this.$route.params.id
      // @ts-ignore
      const messages = this.getMessagesByOrderId(orderId)
      console.log('msg> order id: ', orderId, ' -> ', messages)
      return messages[0]
    },
    isOrderTaken() {
      return steps[this.orderStatus] >= steps[OrderStatus.PENDING] ?? 0
    },
    isWaitingPayment() {
      return steps[this.orderStatus] >= steps[OrderStatus.WAITING_PAYMENT] ?? 0
    },
    isActive() {
      return steps[this.orderStatus] >= steps[OrderStatus.ACTIVE] ?? 0
    },
    isFiatSent() {
      return steps[this.orderStatus] >= steps[OrderStatus.FIAT_SENT] ?? 0
    },
    isFundsReleased() {
      return steps[this.orderStatus] >= steps[OrderStatus.SUCCESS] ?? 0
    }
  }
})
</script>