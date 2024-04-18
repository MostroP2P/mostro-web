<template>
  <NuxtLayout name="no-scroll-layout">
    <v-container v-if="hasOrderIdParam" class="d-flex flex-column mt-0" fill-height style="height: calc(100vh - 120px)" id="my-trades">
      <div class="message-list-wrapper">
        <v-alert
          class="mb-4"
          v-if="isCancelled"
          type="error"
          title="Order Cancelled"
          text="This trade was cancelled"
        />
        <v-alert
          class="mb-4"
          v-if="isSuccess"
          type="success"
          title="Order Completed"
          text="This trade was completed"
        />
      </div>
      <div>
        <CountDown v-if="showCountdown"/>
      </div>
      <v-tabs fixed-tabs v-model="tab" class="mb-2">
        <v-tab
          v-for="tab in tabs"
          :key="tab"
        >
          {{ tabs.length > 1 ? tab : '' }}
        </v-tab>
      </v-tabs>
      <v-window v-model="tab" class="flex-grow-1" style="height: 10%;">
        <v-window-item :key="TAB_NORMAL">
          <div>
            <message-list :order-id="($route.params.id as string)" />
            <trade-actions @dispute="() => openDispute()"></trade-actions>
          </div>
        </v-window-item>
        <v-window-item :key="TAB_DISPUTE">
          <dispute/>
        </v-window-item>
      </v-window>
    </v-container>
  </NuxtLayout>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useOrders } from '~/stores/orders'
import { OrderStatus } from '~/stores/types'
import { useAuth } from '~/stores/auth'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { WatchStopHandle } from 'vue'
const route = useRoute()
const router = useRouter()
const orderStore = useOrders()
const TAB_NORMAL = 'messages'
const TAB_DISPUTE = 'dispute'
const tabs = ref([TAB_NORMAL])
const tab = ref(null as null | number)

const hasOrderIdParam = computed(() => route?.params?.id ? true : false)

definePageMeta({
  layout: false,
})

const isCancelled = computed(() => {
  const orderId = route.params.id as string
  return orderStore.getOrderStatus(orderId) === OrderStatus.CANCELED
})

const isSuccess = computed(() => {
  const orderId = route.params.id as string
  return orderStore.getOrderStatus(orderId) === OrderStatus.SUCCESS
})

const openDispute = () => {
  if (tabs.value.length === 1) {
    // Opens the dispute tab only once
    tabs.value.push(TAB_DISPUTE)
    tab.value = 1
  }
}
const auth = useAuth()
watch(() => auth.isAuthenticated, () => {
  if (!auth.isAuthenticated) {
    // // Redirects to the login page if the user is not logged in
    router.replace('/')
  }
})

// Whether to show the countdown or not
const showCountdown = ref(false)
// Stop watch handle
let stopWatch: WatchStopHandle | undefined

onMounted(() => {
  // Get the specific order and check its status
  const order = orderStore.getOrderById(route.params.id as string)
  if (!order) {
    console.warn(`Order with id ${route.params.id} not found`)
    router.replace('/')
    return
  }
  if (order.status === OrderStatus.WAITING_BUYER_INVOICE || order.status === OrderStatus.WAITING_PAYMENT) {
    // If the order is in the WAITING_BUYER_INVOICE or WAITING_PAYMENT state, show the countdown
    showCountdown.value = true
  }
  // Start watching the specific order, in case the status changes
  stopWatch = watch(
    () => orderStore.orders[route.params.id as string],
    (newOrder, oldOrder) => {
      if (!newOrder || !oldOrder) return
      // This function will be executed whenever the specific order changes
      if (newOrder.status === OrderStatus.WAITING_BUYER_INVOICE || newOrder.status === OrderStatus.WAITING_PAYMENT) {
        // If the order is in the WAITING_BUYER_INVOICE or WAITING_PAYMENT state, show the countdown
        showCountdown.value = true
      } else {
        // Otherwise, hide the countdown
        showCountdown.value = false
      }
    },
    { deep: true }
  )
})

onUnmounted(() => {
  if (stopWatch) {
    stopWatch() // Stop the watcher when the component is unmounted
  }
})

</script>

<style scoped>
#my-trades .flex-grow-1 {
  overflow-y: auto;
}
</style>