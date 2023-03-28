<template>
  <v-form v-model="valid" ref="form">
    <v-text-field
      v-model="fiatCode"
      label="Fiat code"
      hint="Enter fiat code"
      outlined
      required
    >
    </v-text-field>
    <v-text-field
      v-model="fiatAmount"
      label="Fiat amount"
      type="number"
      hint="Specific value, or range. Ex: 10, 10-100"
      outlined
      required
      :rules="fiatAmountRules"
    >
    </v-text-field>
    <v-text-field
      v-model="paymentMethod"
      label="Payment method"
      hint="Enter a description of your payment method"
      outlined
      required
    >
    </v-text-field>
    <div class="d-flex justify-end">
      <v-btn
        color="warning"
        text
        @click="onClose"
      >
        Cancel
      </v-btn>
      <v-btn
        :disabled="!valid"
        color="success"
        class="mr-4"
        text
        @click="onSubmit"
      >
        Submit
      </v-btn>
    </div>
  </v-form>
</template>
<script lang="ts">
import Vue from 'vue'
import { Order, OrderStatus, OrderType } from '../store/orders'
export default Vue.extend({
  data() {
    return {
      valid: false,
      fiatAmount: 100,
      fiatCode: 'pen',
      paymentMethod: 'ibk',
      fiatAmountRules: [
        (v: string) => !!v || 'Fiat amount is required',
        (v: string) => /\d+(?:-\d+)?$/.test(v) || 'Invalid value or range'
      ]
    }
  },
  props: {
    onClose: {
      type: Function,
      required: true
    },
    onProcessingUpdate: {
      type: Function,
      default: () => (arg: boolean) => false
    }
  },
  methods: {
    validate () {
      // @ts-ignore
      this.$refs.form.validate()
    },
    async onSubmit() {
      this.onProcessingUpdate(true)
      const order = {
        kind: OrderType.SELL,
        status: OrderStatus.PENDING,
        amount: 0,
        fiat_code: this.fiatCode,
        fiat_amount: this.fiatAmount,
        prime: 0,
        payment_method: this.paymentMethod,
        created_at: Math.floor(Date.now() / 1e3)
      }
      // @ts-ignore      
      await this.$mostro.submitOrder(order)
      this.onProcessingUpdate(false)
      this.onClose()
    }
  },
  computed: {
  }
})
</script>