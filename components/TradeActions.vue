<template>
  <div class="d-flex justify-center align-center mt-5">
    <pay-invoice-button
      v-if="showPayInvoice"
      :message="payInvoiceMessage"
    />
    <give-invoice-button
      v-if="showGiveInvoice"
      :message="giveInvoiceMessage"
    />
    <fiat-sent-button v-if="showFiatSent"/>
    <div v-if="showDispute">
      <v-btn text color="warning">
        <v-icon left>mdi-alert-outline</v-icon>
        Dispute
      </v-btn>
    </div>
    <release-funds-dialog
      v-if="showRelease"
      :order-id="$route.params.id"
    />
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { OrderStatus, OrderType, MostroMessage, Action } from '~/store/types'
export default Vue.extend({
  computed: {
    ...mapGetters('orders', ['getOrderStatus', 'getOrderById']),
    ...mapGetters('messages', ['getMostroMessagesByOrderId']),
    payInvoiceMessage() {
      const orderId = this.$route.params.id
      // @ts-ignore
      const messages = this.getMostroMessagesByOrderId(orderId)
      return messages.find((msg: MostroMessage) => msg.action === Action.WaitingSellerToPay || msg.action === Action.PayInvoice)
    },
    giveInvoiceMessage() {
      const orderId = this.$route.params.id
      // @ts-ignore
      const messages = this.getMostroMessagesByOrderId(orderId)
      return messages.find((msg: MostroMessage) => msg.action === Action.AddInvoice || msg.action === Action.TakeSell)
    },
    currentOrderStatus() {
      // @ts-ignore
      return this.getOrderStatus(this.$route.params.id)
    },
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    buyerPubkey() {
      // @ts-ignore
      return this.order.buyer_pubkey
    },
    sellerPubkey() {
      // @ts-ignore
      return this.order.seller_pubkey
    },
    isBuy() {
      // @ts-ignore
      return this.order.kind === OrderType.BUY
    },
    isSell() {
      // @ts-ignore
      return this.order.kind === OrderType.SELL
    },
    isLocalSeller() {
      // @ts-ignore
      return this?.$mostro?.getNpub() === this.order?.seller_pubkey
    },
    isLocalBuyer() {
      // @ts-ignore
      return this?.$mostro?.getNpub() === this.order?.buyer_pubkey
    },
    showRelease() {
      // @ts-ignore
      return this.isLocalSeller && this.currentOrderStatus === OrderStatus.FIAT_SENT
    },
    showDispute() {
      if (this.isLocalBuyer) {
        // Rule for local buyer
        // @ts-ignore
        return this.currentOrderStatus === OrderStatus.FIAT_SENT
      } else {
        // Rule for local seller
        // @ts-ignore
        return [OrderStatus.ACTIVE, OrderStatus.FIAT_SENT].includes(this.currentOrderStatus)
      }
    },
    showFiatSent() {
      // @ts-ignore
      return this.currentOrderStatus === OrderStatus.ACTIVE && this.isLocalBuyer
    },
    showPayInvoice() {
      // @ts-ignore
      return this.currentOrderStatus === OrderStatus.WAITING_PAYMENT && this.isLocalBuyer
    },
    showGiveInvoice() {
      // @ts-ignore
      return this.currentOrderStatus === OrderStatus.WAITING_BUYER_INVOICE && this.giveInvoiceMessage
    }
  }
})
</script>