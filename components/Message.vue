<template>
  <v-list-item three-line :disabled="disabled" :style="{ backgroundColor: color }" rounded="lg" style="width: 100vw;">
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
<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrders } from '@/stores/orders'
import type { MostroMessage, Order } from '~/utils/mostro/types'
import { Action } from '~/utils/mostro/types'

// Props definition
const props = defineProps<{
  message: MostroMessage
  disabled?: boolean
}>()

// Store setup
const ordersStore = useOrders()
const { getOrderById } = storeToRefs(ordersStore)

// Add action constant for template usage
const action = Action

// Computed properties
const order = computed<Order | undefined>(() =>
  getOrderById.value(useRoute().params.id as string)
)

const color = computed(() => {
  if (
    props.message.order.action === Action.DisputeInitiatedByYou ||
    props.message.order.action === Action.DisputeInitiatedByPeer ||
    props.message.order.action === Action.AdminTookDispute ||
    props.message.order.action === Action.AdminSettled
  ) {
    return '#BF360C'
  }
  return ''
})

const isLocalBuyer = computed(() => {
  // @ts-ignore
  return useNuxtApp().$mostro?.getNpub() === order.value?.buyer_pubkey
})

const isLocalMaker = computed(() => {
  if (!order.value) console.warn(`Order with id ${useRoute().params.id} not found`)
  return order.value?.is_mine
})
</script>