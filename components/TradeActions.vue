<template>
  <div class="d-flex justify-center align-center mt-5">
    <pay-invoice-button
      v-if="showPayInvoice && payInvoiceMessage"
      :message="payInvoiceMessage"
    />
    <give-invoice-button
      v-if="showGiveInvoice && giveInvoiceMessage"
      :message="giveInvoiceMessage"
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
      :order-id="route.params.id as string"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessages } from '@/stores/messages'
import { useOrders } from '@/stores/orders'
import { useDisputes } from '@/stores/disputes'
import { useAuth } from '@/stores/auth'
import { useNuxtApp } from '#app'
import { OrderStatus, Action, type MostroMessage } from '~/utils/mostro/types'

const emit = defineEmits(['dispute'])
const route = useRoute()
const router = useRouter()
const authStore = useAuth()
const messagesStore = useMessages()
const ordersStore = useOrders()
const disputesStore = useDisputes()
const { $mostro } = useNuxtApp()

const orderId = computed(() => route.params.id as string)
const pubkey = ref<string>()

// Set up the watch to update pubkey when orderId changes
watchEffect(async () => {
  if (orderId.value) {
    pubkey.value = await $mostro.getTradeKeyByOrderId(orderId.value)
  }
})

// Methods
const handleDispute = () => {
  if (order.value) $mostro.dispute(order.value)
  else console.warn(`Order with id ${orderId.value} not found`)
}

const handleCancel = () => {
  console.log('handleCancel')
  if (order.value) $mostro.cancel(order.value)
  else console.warn(`Order with id ${orderId.value} not found`)
  router.replace({ path: '/' })
}

// Computed properties
const payInvoiceMessage = computed(() => {
  const messages = messagesStore.getMostroMessagesByOrderId(orderId.value)
  return messages.find((msg: MostroMessage) =>
    msg.order?.action === Action.WaitingSellerToPay || msg.order?.action === Action.PayInvoice
  )
})

const giveInvoiceMessage = computed(() => {
  const messages = messagesStore.getMostroMessagesByOrderId(orderId.value)
  return messages.find((msg: MostroMessage) =>
    msg.order?.action === Action.AddInvoice || msg.order?.action === Action.TakeSell
  )
})

const currentOrderStatus = computed(() =>
  ordersStore.getOrderStatus(orderId.value)
)

const order = computed(() =>
  ordersStore.getOrderById(orderId.value)
)

const isLocalSeller = computed(() =>
  pubkey.value === order.value?.seller_trade_pubkey
)

const isLocalBuyer = computed(() =>
  pubkey.value === order.value?.buyer_trade_pubkey
)

const showRelease = computed(() =>
  isLocalSeller.value && currentOrderStatus.value === OrderStatus.FIAT_SENT
)

const showCancel = computed(() =>
  currentOrderStatus.value === OrderStatus.WAITING_BUYER_INVOICE && isLocalBuyer.value
)

const isDisputed = computed(() =>
  disputesStore.byOrderId[orderId.value] !== undefined
)

const showDispute = computed(() => {
  if (isDisputed.value) return false
  if (isLocalBuyer.value) {
    return currentOrderStatus.value === OrderStatus.FIAT_SENT
  }
  return [OrderStatus.ACTIVE, OrderStatus.FIAT_SENT].includes(currentOrderStatus.value)
})

const showFiatSent = computed(() => {
  if (isDisputed.value) return false
  return currentOrderStatus.value === OrderStatus.ACTIVE && isLocalBuyer.value
})

const showPayInvoice = computed(() => {
  const messages: MostroMessage[] = messagesStore.getMostroMessagesByOrderId(orderId.value)
  if (!messages || messages.length === 0) return false
  return messages[messages.length - 1].order?.action === Action.PayInvoice &&
    currentOrderStatus.value !== OrderStatus.CANCELED
})

const showGiveInvoice = computed(() =>
  currentOrderStatus.value === OrderStatus.WAITING_BUYER_INVOICE && giveInvoiceMessage.value
)
</script>