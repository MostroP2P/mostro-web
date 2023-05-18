<template>
  <v-card class="mx-auto">
    <v-list v-if="getPendingOrders.length > 0">
      <div v-for="order in getPendingOrders" :key="order.id">
        <v-list-item
          three-line
          link
        >
          <v-list-item-content>
            <v-list-item-title class="d-flex justify-space-between">
              {{ order.fiat_amount }} {{ order.fiat_code.toUpperCase() }}
              <v-chip
                style="cursor: pointer"
                outlined
                :color="order.kind === 'Sell' ? 'red' : 'green'"
                small
              >
                {{ order.kind.toUpperCase() }}
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ summary(order) }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              <div class="d-flex justify-space-between">
                {{ order.payment_method }}
                <take-sell-order-dialog v-if="showTakeSell(order)" :order="order"/>
                <take-buy-order-dialog v-if="showTakeBuy(order)" :order="order"/>
              </div>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider/>
      </div>
    </v-list>
    <no-orders v-else/>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { Order, OrderType } from '../store/types'

export default Vue.extend({
  data() {
    return {
      headerHeight: 64
    }
  },
  methods: {
    showTakeSell(order: Order) {
      return order.kind === OrderType.SELL
    },
    showTakeBuy(order: Order) {
      return order.kind === OrderType.BUY
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
    }
  },
  computed: {
    ...mapGetters('orders', ['getPendingOrders'])
  }
})
</script>