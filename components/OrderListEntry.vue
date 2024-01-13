<template>
  <div>
    <v-list-item
      three-line
      link
    >
      <v-list-item-title class="d-flex justify-space-between">
        {{ order.fiat_amount }} {{ order.fiat_code.toUpperCase() }} {{ getFlag(order.fiat_code) }}
        <v-chip
          class="mt-2 px-4 "
          label
          size="small"
          style="cursor: pointer"
          :color="order.kind === 'Sell' ? 'red' : 'green'"
        >
          {{ order.kind.toUpperCase() === 'BUY' ? 'BUY ORDER' : 'SELL ORDER' }}
        </v-chip>
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ summary(order) }}
      </v-list-item-subtitle>
      <v-list-item-subtitle>
        <div class="d-flex justify-space-between" style="min-height: 2.5em">
          Payment via: {{ order.payment_method }} - id: {{ order.id }}
          <take-sell-order-dialog v-if="showTakeSell(order) && !order.is_mine" :order="order"/>
          <take-buy-order-dialog v-if="showTakeBuy(order) && !order.is_mine" :order="order"/>
        </div>
      </v-list-item-subtitle>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { Order, OrderType } from '@/stores/types'
import { useAuth } from '@/stores/auth'
import fiat from '~/assets/fiat.json'

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

// Define methods
const getFlag = (fiatCode: string) => {
  return fiatMap[fiatCode?.toUpperCase()]?.emoji ?? ''
}

const tradeIn = (order: Order) => {
  if (order.kind === OrderType.SELL) {
    return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
  } else {
    return `${order.amount} sats`
  }
}

const tradeOut = (order: Order) => {
  if (order.kind === OrderType.SELL) {
    return `${order.amount} sats`
  } else {
    return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
  }

}
const summary = (order: Order) => {
  if (order.amount === 0) {
    if (order.kind === OrderType.SELL)
      return `Selling sats for ${tradeIn(order)}`
    else
      return `Buying sats for ${tradeOut(order)}`
  } else {
    if (order.kind === 'Sell')
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
