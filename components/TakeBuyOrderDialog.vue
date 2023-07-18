<template>
  <v-dialog width="500" v-model="showDialog">
    <template v-slot:activator="{ props }">
      <v-btn :disabled="order.is_mine" variant="outlined" v-bind="props">
        Take
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Take Buy Order</v-card-title>
      <v-card-text>
        Confirm you want to sell sats for {{ order.fiat_amount }} {{ order.fiat_code}}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="warning" @click="() => showDialog = false">
          Cancel
        </v-btn>
        <v-btn text color="info" @click="onConfirm">
          Confirm
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { Order } from '~/store/types'
export default {
  data() {
    return {
      showDialog: false,
      isProcessing: false,
      amount: null
    }
  },
  props: {
    order: {
      type: Object as PropType<Order>,
      required: true
    }
  },
  methods: {
    async onConfirm() {
      this.isProcessing = true
      try {
        // @ts-ignore
        await this.$mostro.takeBuy(this.order)
        this.$router.push('/my-trades')
      } catch(err) {
        console.error('Error while taking sell order: ', err)
      } finally {
        this.isProcessing = false
        this.showDialog = false
      }
    }
  }
}
</script>