<template>
  <div>
    <v-card class="mx-auto">
      <v-list v-if="getPendingOrders.length > 0">
        <div v-for="order in getPendingOrders" :key="order.id">
          <OrderDetailsDialog :order="order"/>
          <v-divider/>
        </div>
      </v-list>
      <no-orders v-else/>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { type Order, OrderType } from '~/utils/mostro/types'
import { useOrders } from '@/stores/orders'
import { useAuth } from '@/stores/auth'
import fiat from '~/assets/fiat.json'

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

export default defineComponent({
  setup() {
    const authStore = useAuth()
    const ordersStore = useOrders()
    const getPendingOrders = computed(() => ordersStore.getPendingOrders)
    const selectedOrder = ref<Order | undefined>(undefined)
    const showDialog = ref(true)

    return {
      fiatMap: fiat as { [key: string]: Partial<FiatData> },
      headerHeight: 64,
      authStore,
      getPendingOrders,
      selectedOrder,
      showDialog
    }
  },
  methods: {
    getFlag(fiatCode: string) {
      return this.fiatMap[fiatCode?.toUpperCase()]?.emoji ?? ''
    },
    showTakeSell(order: Order) : boolean {
      const isAuthenticated: boolean = this.authStore.isAuthenticated
      return order.kind === OrderType.SELL && isAuthenticated
    },
    showTakeBuy(order: Order) : boolean {
      const isAuthenticated = this.authStore.isAuthenticated
      return order.kind === OrderType.BUY && isAuthenticated
    },
    summary(order: Order) {
      if (order.amount === 0) {
        if (order.kind === OrderType.SELL)
          return `Selling sats for ${this.tradeIn(order)}`
        else
          return `Buying sats for ${this.tradeOut(order)}`
      } else {
        if (order.kind === OrderType.SELL)
          return `Selling ${this.tradeOut(order)} for ${this.tradeIn(order)}`
        else
          return `Buying ${this.tradeIn(order)} por ${this.tradeOut(order)}`
      }
    },
    tradeIn(order: Order) {
      if (order.kind === OrderType.SELL) {
        return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
      } else {
        return `${order.amount} sats`
      }
    },
    tradeOut(order: Order) {
      if (order.kind === OrderType.SELL) {
        return `${order.amount} sats`
      } else {
        return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
      }
    },
    handleEntryClick(order: Order) {
      this.selectedOrder = order
      this.showDialog = true
    }
  },
})
</script>