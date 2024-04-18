<template>
  <v-badge
    class="mx-2 my-0 py-0"
    offset-y="5"
    :color="getPriceMarginColor(order)"
    :content="(order.premium > 0 ? '+': '') + order.premium +'%'"
  >
  </v-badge>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Order, OrderType } from '~/stores/types'

// Color scale used to classify orders by attractiveness
const Colors = {
  STRONG_GREEN: '#57DC0B',
  LIGHT_GREEN: '#A0DC07',
  AMBER: '#D8C108',
  ORANGE: '#FC5E0A',
  STRONG_RED: '#FC0A0A'
}

export default defineComponent({
  props: {
    order: {
      type: Object as () => Order,
      required: true
    }
  },
  setup(props) {

    const getPriceMarginColor = (order: Order) => {
      if (order.kind === OrderType.BUY) {
        if (order.premium >= 1) {
          return Colors.STRONG_GREEN
        } else if (order.premium >= 0) {
          return Colors.LIGHT_GREEN
        } else if (order.premium >= -1) {
          return Colors.AMBER
        } else if (order.premium >= -2) {
          return Colors.ORANGE
        } else {
          return Colors.STRONG_RED
        }
      } else if (order.kind === OrderType.SELL) {
        if (order.premium > 2) {
          return Colors.STRONG_RED
        } else if (order.premium > 1) {
          return Colors.ORANGE
        } else if (order.premium > 0) {
          return Colors.AMBER
        } else if (order.premium > -1) {
          return Colors.LIGHT_GREEN
        } else {
          return Colors.STRONG_GREEN
        }
      }
    }

    return {
      getPriceMarginColor
    }
  }
})
</script>
