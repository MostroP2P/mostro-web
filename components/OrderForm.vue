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
      hint="Enter a specific value. Ex: 10, 100, etc. Ranges not supported yet"
      outlined
      required
      :rules="fiatAmountRules"
    >
    </v-text-field>
    <v-text-field
      v-model="amount"
      label="Sats amount"
      type="number"
      hint="Amount in satoshis"
      outlined
      required
      :rules="amountRules"
    >
      <template v-slot:append>
        <i class="fak fa-regular"/>
      </template>
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
import { OrderStatus } from '../store/orders'
export default Vue.extend({
  data() {
    return {
      valid: false,
      fiatAmount: 100,
      fiatCode: 'pen',
      amount: 10000,
      paymentMethod: 'ibk',
      fiatAmountRules: [
        (v: string) => !!v || 'Fiat amount is required',
        (v: string) => /\d+(?:-\d+)?$/.test(v) || 'Invalid value or range'
      ],
      amountRules: [
        (v: string) => !!v || 'Sats amount is required'
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
    },
    orderType: {
      type: String,
      required: true,
      validator(value: string) {
        return ['Sell', 'Buy'].includes(value)
      }
    }
  },
  methods: {
    validate () {
      // @ts-ignore
      this.$refs.form.validate()
    },
    async onSubmit() {
      this.onProcessingUpdate(true)
      const fiatAmount = typeof this.fiatAmount === 'number' ?
        this.fiatAmount : parseFloat(this.fiatAmount)
      const satsAmount = typeof this.amount === 'number' ?
        this.amount : parseFloat(this.amount)
      const order = {
        kind: this.orderType,
        status: OrderStatus.PENDING,
        amount: satsAmount,
        fiat_code: this.fiatCode,
        fiat_amount: fiatAmount,
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