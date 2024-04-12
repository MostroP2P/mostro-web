<template>
  <div style="width: 100%">
    <div>
      <v-list-item-title class="d-flex justify-space-between">
        Rate User
        <div class="text-caption text--secondary">
          <CreatedAt :creationDate="creationDate"/>
        </div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p>Please rate your peer.</p>
      </div>
      <v-rating
        color="warning"
        length="5"
        size="32"
        hover
        dense
        light
        v-model="rating"
      >
      </v-rating>
      <div>
        <v-btn variant="text" @click="rateUser">Rate</v-btn>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { MostroMessage } from '~/stores/types'
import CreatedAt from '~/components/CreatedAt.vue'
import type { Mostro } from '~/plugins/02-mostro'
import { useOrders } from '~/stores/orders'

const rating = ref<number>(0)

const props = defineProps({
  message: {
    type: Object as PropType<MostroMessage>,
    required: true
  }
})

const creationDate = computed(() => {
  return props.message.created_at * 1e3
})

const rateUser = async () => {
  console.log(rating.value)
  const nuxtApp = useNuxtApp()
  const $mostro: Mostro = nuxtApp.$mostro as Mostro
  const orders = useOrders()
  const order = orders.getOrderById(props.message.order.id)
  if (order) {
    await $mostro.rateUser(order, rating.value)
  } else {
    console.error(`Could not find order with id: ${props.message.order.id}`)
  }
}
</script>

