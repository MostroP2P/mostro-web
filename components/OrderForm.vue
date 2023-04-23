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
    <v-divider></v-divider>
    <v-switch class="ml-2 mb-3"
      v-model="isMarketPricing"
      inset light
      hint="The pricing mechanism of this order"
      :label="isMarketPricing ? 'Market' : 'Fixed'"
    >
    </v-switch>
    <v-text-field
      v-if="!showInvoiceInput && !isMarketPricing"
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
    <v-textarea
      v-model="buyerInvoice"
      v-if="showInvoiceInput"
      outlined
      :rules="[rules.required, rules.isInvoice, rules.network, rules.value, rules.expired]"
      label="Lightning Invoice with amount to buy"
      :hint="invoiceValueSats ? `Invoice for ${invoiceValueSats} sats` : 'Please enter an invoice'"
    />
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
import lightningPayReq from 'bolt11'
import invoiceValidator from '~/mixins/invoice-validator'
import { OrderStatus, OrderPricingMode, OrderType, NewOrder } from '../store/types'
export default Vue.extend({
  data() {
    return {
      valid: false,
      fiatAmount: 100,
      fiatCode: 'pen',
      amount: 10000,
      paymentMethod: 'ibk',
      isMarketPricing: true,
      buyerInvoice: '',
      fiatAmountRules: [
        (v: string) => !!v || 'Fiat amount is required',
        (v: string) => /\d+(?:-\d+)?$/.test(v) || 'Invalid value or range'
      ],
      amountRules: [
        (v: string) => !!v || 'Sats amount is required'
      ],
      OrderPricingMode
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
  mixins: [ invoiceValidator ],
  watch: {
    buyerInvoice(newValue) {
      // @ts-ignore
      this.decodedInvoice = {}
      try {
        // @ts-ignore
        this.decodedInvoice = lightningPayReq.decode(newValue)
      } catch(err) {}
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
      let satsAmount = typeof this.amount === 'number' ?
        this.amount : parseInt(this.amount)
      if (this.showInvoiceInput) {
        // 'invoiceValueSats' comes from the invoice-validator mixin
        satsAmount = this.invoiceValueSats
      }
      // @ts-ignore
      const order: NewOrder = {
        kind: this.orderType === OrderType.SELL ? OrderType.SELL : OrderType.BUY,
        status: OrderStatus.PENDING,
        amount: 0,
        fiat_code: this.fiatCode,
        fiat_amount: fiatAmount,
        premium: 0,
        payment_method: this.paymentMethod
      }
      if (!this.isMarketPricing) {
        if (this.orderType === OrderType.BUY) {
          order.buyer_invoice = this.buyerInvoice
        } else {
          order.amount = satsAmount
        }
      }
      // @ts-ignore
      await this.$mostro.submitOrder(order)
      this.onProcessingUpdate(false)
      this.onClose()
    }
  },
  computed: {
    showInvoiceInput() {
      return !this.isMarketPricing && this.orderType === 'Buy'
    }
  }
})
</script>