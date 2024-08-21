<template>
  <v-list-item three-line :disabled="disabled" :style="{ backgroundColor: color }" rounded="lg">
    <pay-invoice-message
      v-if="message.order.action === action.PayInvoice"
      :message="message"
    />
    <order-taken-message
      v-if="message.order.action === action.NewOrder"
      :message="message"
    />
    <waiting-buyer-invoice-message
      v-if="message.order.action === action.WaitingBuyerInvoice"
      :message="message"
    />
    <take-sell-message
      v-if="message.order.action === action.TakeSell"
      :message="message"
    />
    <invoice-accepted-message
      v-if="message.order.action === action.BuyerTookOrder"
      :message="message"
    />
    <fiat-sent-message
      v-if="message.order.action === action.FiatSentOk || message.order.action === action.FiatSent"
      :message="message"
    />
    <sale-completed-message
      v-if="message.order.action === action.HoldInvoicePaymentSettled"
      :message="message"
    />
    <waiting-seller-to-pay
      v-if="message.order.action === action.WaitingSellerToPay"
      :message="message"
    />
    <add-invoice-maker-message
      v-if="message.order.action === action.AddInvoice && isLocalMaker"
      :message="message"
    />
    <add-invoice-taker-message
      v-if="message.order.action === action.AddInvoice && !isLocalMaker"
      :message="message"
    />
    <hodl-invoice-payment-accepted
      v-if="message.order.action === action.HoldInvoicePaymentAccepted"
      :message="message"
    />
    <released-message
      v-if="message.order.action === action.Released || message.order.action === action.Release"
      :message="message"
    />
    <purchase-completed-message
      v-if="message.order.action === action.PurchaseCompleted"
      :message="message"
    />
    <rate-user-message
      v-if="message.order.action === action.Rate || message.order.action === action.RateUser"
      :message="message"
    />
    <not-allowed-by-status
      v-if="message.order.action === action.NotAllowedByStatus"
      :message="message"
    />
    <dispute-message
      v-if="
        message.order.action === action.DisputeInitiatedByYou ||
        message.order.action === action.DisputeInitiatedByPeer"
      :message="message"
    />
    <admin-took-dispute
      v-if="message.order.action === action.AdminTookDispute"
      :message="message"
    />
    <admin-settled
      v-if="message.order.action === action.AdminSettled"
      :message="message"
    />
    <payment-failed
      v-if="message.order.action === action.PaymentFailed"
      :message="message"
    />
  </v-list-item>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { useOrders } from '@/stores/orders'
import type { PropType } from 'vue'
import type { MostroMessage, Order } from '~/stores/types'
import { Action } from '~/stores/types'
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
    order(): Order | undefined {
      return this.getOrderById(this.$route.params.id as string)
    },
    color(){
      if(
        this.message.order.action === Action.DisputeInitiatedByYou ||
        this.message.order.action === Action.DisputeInitiatedByPeer ||
        this.message.order.action === Action.AdminTookDispute ||
        this.message.order.action === Action.AdminSettled
      ) {
        return '#BF360C'
      }
      return ''
    },
    isLocalBuyer() {
      // @ts-ignore
      return this?.$mostro?.getNpub() === this.order?.buyer_pubkey
    },
    isLocalMaker() {
      if (!this.order) console.warn(`Order with id ${this.$route.params.id} not found`)
      return this.order?.is_mine
    }
  }
}
</script>