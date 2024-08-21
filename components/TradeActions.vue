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
import { useDisputes } from '@/stores/disputes'
import { OrderStatus, OrderType, Action } from '~/stores/types'
import { type MostroMessage, Order } from '~/stores/types'
import { Mostro } from '~/plugins/02-mostro'

export default {
  emits: ['dispute'],
  data() {
    const route = useRoute()
    return {
      orderId: route.params.id as string
    }
  },
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
    ...mapState(useDisputes, ['byOrderId']),
    payInvoiceMessage() {
      const orderId = this.$route.params.id as string
      const messages = this.getMostroMessagesByOrderId(orderId)
      return messages
        .find((msg: MostroMessage) => msg.order.action === Action.WaitingSellerToPay || msg.order.action === Action.PayInvoice)
    },
    giveInvoiceMessage() {
      const orderId = this.$route.params.id as string
      const messages = this.getMostroMessagesByOrderId(orderId)
      return messages.find((msg: MostroMessage) => msg.order.action === Action.AddInvoice || msg.order.action === Action.TakeSell)
    },
    currentOrderStatus(): OrderStatus {
      return this.getOrderStatus(this.orderId)
    },
    order(): Order | undefined {
      return this.getOrderById(this.orderId)
    },
    buyerPubkey() {
      return this.order?.buyer_pubkey ?? '?'
    },
    sellerPubkey() {
      return this.order?.seller_pubkey ?? '?'
    },
    isBuy() {
      if (!this.order) console.warn(`Order with id ${this.orderId} not found`)
      return this.order?.kind === OrderType.BUY
    },
    isSell() {
      if (!this.order) console.warn(`Order with id ${this.orderId} not found`)
      return this.order?.kind === OrderType.SELL
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
      return this.isLocalSeller && this.currentOrderStatus === OrderStatus.FIAT_SENT
    },
    showCancel() {
      return this.currentOrderStatus === OrderStatus.WAITING_BUYER_INVOICE && this.isLocalBuyer
    },
    isDisputed() {
      return this.byOrderId[this.orderId] !== undefined
    },
    showDispute() {
      if (this.isDisputed) {
        // Dispute already exists
        return false
      }
      if (this.isLocalBuyer) {
        // Rule for local buyer
        return this.currentOrderStatus === OrderStatus.FIAT_SENT
      } else {
        // Rule for local seller
        return [OrderStatus.ACTIVE, OrderStatus.FIAT_SENT].includes(this.currentOrderStatus)
      }
    },
    showFiatSent() {
      if (this.isDisputed) {
        return false
      }
      return this.currentOrderStatus === OrderStatus.ACTIVE && this.isLocalBuyer
    },
    showPayInvoice() {
      const messages: MostroMessage[] = this.getMostroMessagesByOrderId(this.orderId)
      if (!messages || messages.length === 0) return false
      return messages[messages.length - 1].order.action === Action.PayInvoice &&
        this.currentOrderStatus !== OrderStatus.CANCELED
    },
    isCancelled() {
      return this.currentOrderStatus === OrderStatus.CANCELED
    },
    showGiveInvoice() {      return this.currentOrderStatus === OrderStatus.WAITING_BUYER_INVOICE && this.giveInvoiceMessage
    }
  }
}
</script>