<template>
  <NuxtLayout name="no-scroll-layout">
    <v-container class="d-flex flex-column mt-0" fill-height style="height: calc(100vh - 120px)" id="my-trades">
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
            <message-list :order-id="$route.params.id" />
            <trade-actions @on-dispute="() => openDispute()"></trade-actions>
          </div>
        </v-window-item>
        <v-window-item :key="TAB_DISPUTE">
          <dispute/>
        </v-window-item>
      </v-window>
    </v-container>
  </NuxtLayout>
</template>
<script setup>
import { mapState } from 'pinia'
import { useRoute } from 'vue-router'
import { useOrders } from '~/stores/orders'
import { OrderStatus } from '~/stores/types'
import { ref, computed, onMounted } from 'vue'
const route = useRoute()
const orderStore = useOrders()
const TAB_NORMAL = 'messages'
const TAB_DISPUTE = 'dispute'
const tabs = ref([TAB_NORMAL])
const tab = ref(null)

definePageMeta({
  layout: false,
})

const isCancelled = computed(() => {
  const orderId = route.params.id
  return orderStore.getOrderStatus(orderId) === OrderStatus.CANCELED
})

const isSuccess = computed(() => {
  const orderId = route.params.id
  return orderStore.getOrderStatus(orderId) === OrderStatus.SUCCESS
})

const openDispute = () => {
  if (tabs.value.length === 1) {
    // Opens the dispute tab only once
    tabs.value.push(TAB_DISPUTE)
    tab.value = 1
  }
}
</script>

<style scoped>
#my-trades .flex-grow-1 {
  overflow-y: auto;
}
</style>