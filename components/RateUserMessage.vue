<template>
  <div style="width: 100%">
    <div>
      <v-list-item-title class="d-flex justify-space-between">
        {{ rateTitle }}
        <div class="text-caption text--secondary">
          <CreatedAt :creationDate="creationDate"/>
        </div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p>{{ rateMessage }}.</p>
      </div>
      <v-rating
        color="warning"
        length="5"
        size="32"
        :hover="!isRated"
        :readonly="isRated"
        dense
        light
        v-model="rating"
      >
      </v-rating>
      <div>
        <v-btn
          v-if="!isRated"
          variant="text"
          @click="rateUser"
        >
          Rate
        </v-btn>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { MostroMessage } from '~/stores/types'
import CreatedAt from '~/components/CreatedAt.vue'
import type { Mostro } from '~/plugins/02-mostro'
import { useOrders } from '~/stores/orders'


const props = defineProps({
  message: {
    type: Object as PropType<MostroMessage>,
    required: true
  }
})

const storedOrder = useOrders().getOrderById(props.message.order.id)
const rating = ref<number>(storedOrder?.rating?.value || 0)

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

const isRated = computed(() => {
  const storedOrder = useOrders().getOrderById(props.message.order.id)
  return storedOrder?.rating?.confirmed
})

const rateTitle = computed(() => {
  return isRated.value ? 'User rated' : 'Feedback required'
})

const rateMessage = computed(() => {
  return isRated.value ? 'Thanks for providing feedback' : 'Please rate your experience with this user'
})

</script>

