<template>
  <v-dialog width="500" v-model="showDialog">
    <template v-slot:activator="{ on, attrs }">
      <v-btn small text rounded color="primary" v-bind="attrs" v-on="on">
        Take
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Take Sell Order</v-card-title>
      <v-card-text>
        Confirm that you want to buy sats, taking this order. Mostro will contact you via DM and ask you to pay an invoice.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="warning" @click="() => showDialog = false">
          Cancel
        </v-btn>
        <v-btn text color="primary" @click="onConfirm">
          Confirm
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { Order } from '~/store/types'
export default Vue.extend({
  data() {
    return {
      showDialog: false,
      isProcessing: false
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
        await this.$mostro.takeSell(this.order, null)
        this.$router.push(`/my-trades/${this.order.id}`)
      } catch(err) {
        console.error('Error while confirming sell order: ', err)
      } finally {
        this.isProcessing = true
        this.showDialog = false
      }
    }
  }
})
</script>