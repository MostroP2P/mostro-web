<template>
  <div>
    <v-list-item
      three-line
      link
    >
      <v-list-item-title class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <div class="mr-4">
            <span class="font-weight-bold">{{ orderAmount }} {{ order.fiat_code.toUpperCase() }}</span> {{ getFlag(order.fiat_code) }}
          </div>
          <PriceDeltaBadge v-if="order.amount === 0" class="mt-1" :order="order"/>
        </div>
        <v-chip
          class="mt-2 px-4 "
          label
          size="small"
          style="cursor: pointer"
          :color="order.kind === OrderType.SELL ? 'red' : 'green'"
        >
          {{ order.kind.toUpperCase() === 'BUY' ? 'BUY ORDER' : 'SELL ORDER' }}
        </v-chip>
      </v-list-item-title>
      <v-list-item-subtitle class="my-1">
        {{ summary(order) }}
      </v-list-item-subtitle>
      <v-list-item-subtitle class="my-1">
        Created <span class="font-weight-bold">{{ createdAt }}</span> | Expires <span class="font-weight-bold">{{ expiresIn }}</span> ⏳
      </v-list-item-subtitle>
      <v-list-item-subtitle class="my-1">
        <div class="d-flex justify-space-between">
          <div>Payment via: <span class="font-weight-bold">{{ order.payment_method }}</span></div>
          <take-sell-order-dialog v-if="showTakeSell(order) && !order.is_mine" :order="order"/>
          <take-buy-order-dialog v-if="showTakeBuy(order) && !order.is_mine" :order="order"/>
        </div>
      </v-list-item-subtitle>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { OrderType, type Order } from '~/utils/mostro/types'
import { useAuth } from '@/stores/auth'
import { useTimeago } from '@/composables/timeago'
import fiat from '~/assets/fiat.json'
import { ORDER_LIFETIME_IN_SECONDS } from '~/stores/orders';

const authStore = useAuth()

type FiatData = {
  symbol: string,
  name: string,
  symbol_native: string,
  decimal_digits: number,
  rounding: number,
  code: string,
  emoji: string,
  name_plural: string,
  price: boolean
}

const fiatMap = fiat as { [key: string]: Partial<FiatData> }

// Define props
const props = defineProps({
  order: {
    type: Object as () => Order,
    required: true,
  },
})

const createdAt = computed(() => {
  const createdAt = props.order.created_at * 1E3
  const { format } = useTimeago()
  return format(createdAt)
})

const expiresIn = computed(() => {
  const createdAt = props.order.created_at * 1E3
  const expiresAt = createdAt + ORDER_LIFETIME_IN_SECONDS * 1E3
  const { format } = useTimeago()
  return format(expiresAt)
})

const orderAmount = computed(() => {
  const order = props.order
  if (order.min_amount !== null && order.max_amount !== null) {
    return `${order.min_amount} - ${order.max_amount}`
  } else {
    return `${order.fiat_amount}`
  }
})

// Define methods
const getFlag = (fiatCode: string) => {
  return fiatMap[fiatCode?.toUpperCase()]?.emoji ?? ''
}

const tradeIn = (order: Order) => {
  if (order.kind === OrderType.SELL) {
    const isRangedOrder = order.min_amount !== null && order.max_amount !== null
    if (isRangedOrder) {
      return `${order.min_amount}-${order.max_amount} ${order.fiat_code.toUpperCase()}`
    } else {
      return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
    }
  } else {
    return `${order.amount} sats`
  }
}

const tradeOut = (order: Order) => {
  if (order.kind === OrderType.SELL) {
    return `${order.amount} sats`
  } else {
    const isRangedOrder = order.min_amount !== null && order.max_amount !== null
    if (isRangedOrder) {
      return `${order.min_amount}-${order.max_amount} ${order.fiat_code.toUpperCase()}`
    } else {
      return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
    }
  }

}
const summary = (order: Order) => {
  if (order.amount === 0) {
    if (order.kind === OrderType.SELL)
      return `Selling sats for ${tradeIn(order)}`
    else
      return `Buying sats for ${tradeOut(order)}`
  } else {
    if (order.kind === OrderType.SELL)
      return `Selling ${tradeOut(order)} for ${tradeIn(order)}`
    else
      return `Buying ${tradeIn(order)} for ${tradeOut(order)}`
  }
}

const showTakeSell = (order: Order) => {
  const isAuthenticated: boolean = authStore.isAuthenticated ?? false
  return order.kind === OrderType.SELL && isAuthenticated
};

const showTakeBuy = (order: Order) => {
  const isAuthenticated = authStore.isAuthenticated
  return order.kind === OrderType.BUY && isAuthenticated
};
</script>

