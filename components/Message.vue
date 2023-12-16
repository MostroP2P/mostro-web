<template>
  <v-list-item three-line :disabled="disabled">
    <pay-invoice-message
      v-if="message.Order.action === action.PayInvoice"
      :message="message"
    />
    <order-taken-message
      v-if="message.Order.action === action.Order"
      :message="message"
    />
    <waiting-buyer-invoice-message
      v-if="message.Order.action === action.WaitingBuyerInvoice"
      :message="message"
    />
    <take-sell-message
      v-if="message.Order.action === action.TakeSell"
      :message="message"
    />
    <invoice-accepted-message
      v-if="message.Order.action === action.BuyerTookOrder"
      :message="message"
    />
    <fiat-sent-message
      v-if="message.Order.action === action.FiatSent"
      :message="message"
    />
    <sale-completed-message
      v-if="message.Order.action === action.HoldInvoicePaymentSettled"
      :message="message"
    />
    <waiting-seller-to-pay
      v-if="message.Order.action === action.WaitingSellerToPay"
      :message="message"
    />
    <add-invoice-maker-message
      v-if="message.Order.action === action.AddInvoice && isLocalMaker"
      :message="message"
    />
    <add-invoice-taker-message
      v-if="message.Order.action === action.AddInvoice && !isLocalMaker"
      :message="message"
    />
    <hodl-invoice-payment-accepted
      v-if="message.Order.action === action.HoldInvoicePaymentAccepted"
      :message="message"
    />
    <released-message
      v-if="message.Order.action === action.Release"
      :message="message"
    />
    <purchase-completed-message
      v-if="message.Order.action === action.PurchaseCompleted"
      :message="message"
    />
    <rate-user-message
      v-if="message.Order.action === action.RateUser"
      :message="message"
    />
  </v-list-item>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { useOrders } from '@/stores/orders'
import type { PropType } from 'vue'
import { MostroMessage, Action } from '~/stores/types'

export default {
  data() {
    return {
      action: Action
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    isLocalBuyer() {
      // @ts-ignore
      return this?.$mostro?.getNpub() === this.order?.buyer_pubkey
    },
    isLocalMaker() {
      // @ts-ignore
      return this.order?.is_mine
    }
  }
}
</script>