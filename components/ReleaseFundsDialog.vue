<template>
  <v-dialog v-model="showDialog" width="500">
    <template v-slot:activator="{ props }">
      <v-btn text color="success" v-bind="props" prepend-icon="mdi-check" class="mx-2" min-width="160">
        Release
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Are you sure?</v-card-title>
      <v-card-text>
        You will be releasing the funds to your counterparty, please make sure you got your fiat correctly.
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn
          color="warning"
          text
          @click="showDialog = false"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          text
          prepend-icon="mdi-thumb-up"
          @click="release"
        >
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>

  </v-dialog>
</template>

<script lang="ts">
import { mapState } from 'pinia'
import { useOrders } from '~/stores/orders'
import { Order } from '~/stores/types'
export default {
  data() {
    return {
      showDialog: false
    }
  },
  props: {
    orderId: {
      type: String,
      required: true
    }
  },
  methods: {
    async release() {
      const order: Order = this.orders[this.orderId]
      if (order) {
        // @ts-ignore
        await this.$mostro.release(order)
      } else {
        console.warn('Order not found: ', this.orderId)
      }
      this.showDialog = false
    }
  },
  computed: {
    ...mapState(useOrders, ['orders']),
  }
}
</script>