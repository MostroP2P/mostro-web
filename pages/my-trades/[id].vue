<template>
  <v-container class="d-flex flex-column" style="min-height: 82vh">
    <div class="message-list-wrapper flex-grow-1">
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
      <message-list :order-id="$route.params.id"/>
    </div>
    <trade-actions></trade-actions>
  </v-container>
</template>
<script setup>
import { mapState } from 'pinia'
import { useRoute } from 'vue-router'
import { useOrders } from '~/stores/orders'
import { OrderStatus } from '~/stores/types'
import { ref, computed } from 'vue'
const route = useRoute()
const orderStore = useOrders()

const isCancelled = computed(() => {
  const orderId = route.params.id
  return orderStore.getOrderStatus(orderId) === OrderStatus.CANCELED
})

const isSuccess = computed(() => {
  const orderId = route.params.id
  return orderStore.getOrderStatus(orderId) === OrderStatus.SUCCESS
})
</script>