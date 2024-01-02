<template>
  <div class="d-flex justify-center align-center mt-5">
    <pay-invoice-button
      v-if="showPayInvoice"
      :message="(payInvoiceMessage as MostroMessage)"
    />
    <give-invoice-button
      v-if="showGiveInvoice"
      :message="(giveInvoiceMessage as MostroMessage)"
    />
    <fiat-sent-button
      v-if="showFiatSent"
    />
    <dispute-button
      v-if="showDispute"
      @dispute="handleDispute"
    />
    <cancel-button
      v-if="showCancel"
      @cancel="handleCancel"
    />
    <release-funds-dialog
      v-if="showRelease"
      :order-id="$route.params.id as string"
    />
  </div>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { useRoute } from 'vue-router'
import { useMessages } from '@/stores/messages'
import { useOrders } from '@/stores/orders'
import { OrderStatus, OrderType, MostroMessage, Action } from '~/stores/types'
import { Mostro } from 'plugins/02-mostro'

export default {
  emits: ['dispute'],
  methods: {
    handleDispute() {
      // Opens a dispute
      const { $mostro } = useNuxtApp()
      // @ts-ignore
      $mostro.dispute(this.order)
      this.$emit('dispute')
    },
    handleCancel() {
      console.log('handleCancel')
      // Cancels the order
      const { $mostro, $router } = useNuxtApp()
      // @ts-ignore
      $mostro.cancel(this.order)
      $router.replace({ path: '/' })
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderStatus', 'getOrderById']),
    ...mapState(useMessages, ['getMostroMessagesByOrderId']),
    payInvoiceMessage() {
      const orderId = this.$route.params.id
      // @ts-ignore
      const messages = this.getMostroMessagesByOrderId(orderId)
      return messages
        .find((msg: MostroMessage) => msg.Order.action === Action.WaitingSellerToPay || msg.Order.action === Action.PayInvoice)
    },
    giveInvoiceMessage() {
      const orderId = this.$route.params.id
      // @ts-ignore
      const messages = this.getMostroMessagesByOrderId(orderId)
      return messages.find((msg: MostroMessage) => msg.Order.action === Action.AddInvoice || msg.Order.action === Action.TakeSell)
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
      const userPubKey = (this.$mostro as Mostro).getUserPublicKey()
      return userPubKey.hex === this.order?.master_seller_pubkey
    },
    isLocalBuyer() {
      const userPubKey = (this.$mostro as Mostro).getUserPublicKey()
      return userPubKey.hex === this.order?.master_buyer_pubkey
    },
    showRelease() {
      // @ts-ignore
      return this.isLocalSeller && this.currentOrderStatus === OrderStatus.FIAT_SENT
    },
    showCancel() {
      return this.currentOrderStatus === OrderStatus.WAITING_BUYER_INVOICE
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
      const messages: MostroMessage[] = this.getMostroMessagesByOrderId(orderId)
      if (!messages || messages.length === 0) return false
      return messages[messages.length - 1].Order.action === Action.PayInvoice &&
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