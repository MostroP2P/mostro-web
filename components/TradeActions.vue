<template>
  <div class="d-flex justify-center align-center mt-5">
    <pay-invoice-button
      class="mx-3"
      v-if="showPayInvoice"
      :message="payInvoiceMessage"
    />
    <give-invoice-button
      class="mx-3"
      v-if="showGiveInvoice"
      :message="giveInvoiceMessage"
    />
    <fiat-sent-button v-if="showFiatSent" class="mx-3"/>
    <dispute-button v-if="showDispute || true" @dispute="handleDispute"/>
    <release-funds-dialog
      class="mx-3"
      v-if="showRelease"
      :order-id="$route.params.id"
    />
  </div>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { useRoute } from 'vue-router'
import { useMessages } from '@/stores/messages'
import { useOrders } from '@/stores/orders'
import { OrderStatus, OrderType, MostroMessage, Action } from '~/stores/types'
export default {
  emits: ['dispute'],
  methods: {
    handleDispute() {
      // Opens a dispute
      const { $mostro } = useNuxtApp()
      // @ts-ignore
      $mostro.dispute(this.order)
      this.$emit('dispute')
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderStatus', 'getOrderById']),
    ...mapState(useMessages, ['getMostroMessagesByOrderId']),
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
      const route = useRoute()
      // @ts-ignore
      return this.getOrderStatus(route.params.id)
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
      const orderId = this.$route.params.id
      // @ts-ignore
      const messages = this.getMostroMessagesByOrderId(orderId)
      if (!messages || messages.length === 0) return false
      return messages[messages.length - 1]?.action === Action.PayInvoice &&
        this.currentOrderStatus !== OrderStatus.CANCELED
    },
    isCancelled() {
      return this.currentOrderStatus === OrderStatus.CANCELED
    },
    showGiveInvoice() {
      // @ts-ignore
      return this.currentOrderStatus === OrderStatus.WAITING_BUYER_INVOICE && this.giveInvoiceMessage
    }
  }
}
</script>