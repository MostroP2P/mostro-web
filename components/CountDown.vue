<template>
  <div>
    <v-progress-linear
      :model-value="progressRemaining"
      color="light-green"
      height="25"
      striped
      rounded
    >
    </v-progress-linear>
    <div
      class="text-center text-caption"
      :class="{ 'text-danger': isCloseToEnd }"
    >
      {{ Math.floor(secondsRemaining / 60) }} minutes {{ Math.floor(secondsRemaining % 60) }} seconds remaining
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useOrders } from '~/stores/orders'
import { OrderStatus } from '~/stores/types'

const route = useRoute()
const orderStore = useOrders()
const ORDER_WAIT_TIME_SEC = 900
const ORDER_WAIT_TIME_MS = ORDER_WAIT_TIME_SEC * 1E3
const CLOSE_TO_END_THRESHOLD = 5 // Expressed in percentage terms

const secondsRemaining = ref(ORDER_WAIT_TIME_MS / 1000)
const progressRemaining = computed(() => (secondsRemaining.value / ORDER_WAIT_TIME_SEC) * 100)
const isCloseToEnd = computed(() => progressRemaining.value < CLOSE_TO_END_THRESHOLD)

const updateCountdown = () => {
  const order = orderStore.getOrderById(route.params.id as string)
  if (!order) {
    console.warn(`Order with id ${route.params.id} not found`)
    return
  }
  if (order.status === OrderStatus.WAITING_BUYER_INVOICE || order.status === OrderStatus.WAITING_PAYMENT) {
    const now = new Date().getTime()
    const lastUpdate = order.updated_at ? order.updated_at * 1e3 : order.created_at * 1e3
    const secsRemaining = Math.floor((lastUpdate + ORDER_WAIT_TIME_MS - now) / 1000)
    secondsRemaining.value = Math.max(secsRemaining, 0)
  } else {
    console.warn('Order is not in the WAITING_BUYER_INVOICE or WAITING_PAYMENT state, state: ', order.status)
  }
}

let intervalId: NodeJS.Timeout | undefined = undefined

onMounted(() => {
  updateCountdown() // Initialize the countdown
  intervalId = setInterval(() => {
    updateCountdown()
  }, 1e3) // Update every second
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId) // Clear the interval when the component is unmounted
  }
})

</script>

<style>
.text-danger {
  color: #EF9A9A;
  font-weight: 600;
}
</style>

