<template>
  <v-card class="mx-auto">
    <v-list>
    <v-list-item v-for="order in orders"
      :key="order.id"
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
          {{ order.payment_method }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { Order, OrderType } from '../store/orders'

export default Vue.extend({
  data() {
    return {
      headerHeight: 64
    }
  },
  methods: {
    summary(order: Order) {
      if (order.kind === OrderType.SELL)
        return `Vendiendo ${this.tradeOut(order)} por ${this.tradeIn(order)}`
      else
        return `Comprando ${this.tradeIn(order)} por ${this.tradeOut(order)}`
    },
    tradeIn(order: Order) {
      if (order.kind === OrderType.SELL) {
        return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
      } else {
        return `${order.amount} Sats`
      }
    },
    tradeOut(order: Order) {
      if (order.kind === OrderType.SELL) {
        return `${order.amount} Sats`
      } else {
        return `${order.fiat_amount} ${order.fiat_code.toUpperCase()}`
      }
    }
  },
  computed: {
    ...mapState('orders', ['orders'])
  }
})
</script>