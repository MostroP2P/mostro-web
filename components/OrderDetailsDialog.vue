<template>
  <v-dialog
    v-model="showDialog"
    width="600"
  >
    <template v-slot:activator="{ props }">
      <OrderListEntry :order="order" v-bind="props"/>
    </template>
    <v-card>
      <v-card-title class="text-h5 ma-2">
        Order Details
      </v-card-title>
      <v-card-text>
        <div v-if="isFixedPrice">
          {{ getOrderSubject() }} {{ getOrderVerb() }} <strong class="highlight">{{ formattedSatsAmount }} <i class="fak fa-bold"></i></strong> for <strong class="highlight">{{ order.fiat_amount }} {{ order.fiat_code }} {{ fiatFlag }}</strong>
        </div>
        <div v-if="!isFixedPrice">
          {{ getOrderSubject() }} {{ getOrderVerb() }} <strong class="highlight">{{ formattedFiatAmount }} {{ order.fiat_code }} {{ fiatFlag }}</strong>
          at market price
          <span v-if="hasPremiumOrDiscount">with a <strong class="highlight">{{ order.premium > 0 ? '+' : '-' }}{{order.premium}}%</strong> {{ delta }}</span>
          <span v-else>with no premium or discount.</span>
        </div>
      </v-card-text>
      <v-card-text>
        Created at: <strong class="highlight">{{ creationDate }}</strong>
      </v-card-text>
      <v-card-text>
        The payment method is <strong class="highlight">{{ order.payment_method }}</strong>
      </v-card-text>
      <v-tooltip text="Order ID" location="top">
        <template v-slot:activator="{props}">
          <div class="mx-3 mt-2 mb-4 d-flex justify-center">
            <v-chip
              v-bind="props"
              @click="() => copyOrderId(order.id)"
              variant="tonal"
              rounded="true"
              color="primary"
              append-icon="mdi-vector-arrange-below"
            >
              {{ order?.id }}
            </v-chip>
          </div>    
        </template>
      </v-tooltip>
      <div class="d-flex justify-center">
        <v-progress-circular color="primary" :model-value="progress" :width="10"></v-progress-circular>
      </div>
      <v-card-text class="text-caption d-flex justify-center">Time Left: {{hours}}h {{minutes}}m {{seconds}}s</v-card-text>
      <div class="d-flex justify-center mt-5" v-if="isAuthenticated">
        <v-btn v-if="order.is_mine"
          color="red"
          prepend-icon="mdi-delete"
          variant="outlined"
          @click="cancelOrder()"
        >
          Cancel Order
        </v-btn>
        <TakeBuyOrderDialog v-else-if="order.kind === OrderType.BUY" :order="order"/>
        <TakeSellOrderDialog v-else-if="order.kind === OrderType.SELL" :order="order"/>
      </div>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="warning" @click="showDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { OrderType, type Order } from '~/utils/mostro/types'
import { useAuth } from '~/stores/auth'
import fiat from '~/assets/fiat.json'
import type { Mostro } from '~/utils/mostro'

const ORDER_LIFETIME_IN_SECONDS = 3600 * 24 // 24 hours

const fiatMap = fiat as { [key: string]: Partial<FiatData> }
const showDialog = ref(false)
const now = ref<number>(Date.now() / 1E3)
const nuxtApp = useNuxtApp()
const authStore = useAuth()

const props = defineProps({
  order: {
    type: Object as () => Order,
    required: true,
  }
})

const creationDate = computed(() => new Date(props.order.created_at * 1E3))

let timeout: null | NodeJS.Timeout = null

watch(showDialog, (newVal, oldVal) => {
  if (newVal) {
    timeout = setInterval(() => {
      console.log('tick')
      now.value = Date.now() / 1E3
    }, 1000)
  } else {
    if (timeout)
      clearInterval(timeout)
  }
})

const cancelOrder = async () => {
  const orderStore = useOrders()
  const mostro = nuxtApp.vueApp.config.globalProperties.$mostro as Mostro
  try {
    const response = await mostro.cancel(props.order)
    if (response['cant-do']) {
      console.warn('Cant do: ', response['cant-do'])
    }
  } catch(err) {
    console.error('Error cancelling order: ', err)
  }
  orderStore.removeOrder(props.order)
  showDialog.value = false
}

const getOrderVerb = () => {
  return props.order.kind ===  OrderType.BUY ? 'buying sats for' : 'selling sats for '
}

const getOrderSubject = () => {
  return props.order.is_mine ? 'You are ' : 'Someone is '
}

const isFixedPrice = computed(() => {
  return props.order.amount && props.order.amount > 0
})

const formattedSatsAmount = computed(() => {
  const amount = Number(props.order.amount) || 0
  const numberFormat = new Intl.NumberFormat((nuxtApp.$i18n as any).locale, { style: 'decimal' })
  return numberFormat.format(amount)
})

const formattedFiatAmount = computed(() => {
  const amount = Number(props.order.fiat_amount) || 0
  const numberFormat = new Intl.NumberFormat((nuxtApp.$i18n as any).locale, { style: 'decimal' })
  if (amount !== 0) {
    return numberFormat.format(amount)
  } else {
    const min = Number(props.order.min_amount) || 0
    const max = Number(props.order.max_amount) || 0
    return `${numberFormat.format(min)}-${numberFormat.format(max)}`
  }
})

const delta = computed(() => {
  return props.order.premium > 0 ? 'premium' : 'discount'
})

const hasPremiumOrDiscount = computed(() => {
  return props.order.premium && props.order.premium !== 0
})

const copyOrderId = (orderId: string) => {
  navigator.clipboard.writeText(orderId)
}

const timeLeft = computed(() => {
  const createdAt = props.order.created_at
  return Math.floor((createdAt + ORDER_LIFETIME_IN_SECONDS - now.value))
})

const progress = computed(() => {
  return (timeLeft.value / ORDER_LIFETIME_IN_SECONDS) * 100
})

const seconds = computed(() => {
  return timeLeft.value % 60
})

const minutes = computed(() => {
  return Math.floor(timeLeft.value / 60) % 60
})

const hours = computed(() => {
  return Math.floor(timeLeft.value / 3600)
})

const fiatFlag = computed(() => {
  return fiatMap[props.order.fiat_code.toUpperCase()]?.emoji ?? ''
})

const isAuthenticated = computed(() => authStore.isAuthenticated)

const emits = defineEmits(['update:showDialog'])

</script>

<style scoped>
.highlight {
  background-color: #00695d3b; /* Clear green */
  border-radius: 10px; /* Rounded corners */
  padding: 2px 8px; /* Some padding */
}
</style>