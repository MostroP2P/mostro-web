<template>
  <v-form v-model="valid" ref="form">
    <v-autocomplete
      :model-value="selectedCurrency"
      :items="fiatCurrencies"
      label="Fiat code"
      hint="Enter fiat code"
      outlined
      required
    >
      <template v-slot:item="{ props, item }">
        <v-list-item
          three-line
          v-bind="props"
          :title="item?.title"
          :subtitle="item?.raw?.fullName"
        >
        </v-list-item>
      </template>
    </v-autocomplete>
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
      inset
      color="accent"
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
        class="mx-3"
        color="warning"
        text
        @click="onClose"
      >
        Cancel
      </v-btn>
      <v-btn
        :disabled="!valid"
        color="success"
        text
        @click="onSubmit"
      >
        Submit
      </v-btn>
    </div>
  </v-form>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import * as bolt11 from 'light-bolt11-decoder'
import invoiceValidator from '~/mixins/invoice-validator'
import { OrderStatus, OrderPricingMode, OrderType, NewOrder } from '@/stores/types'
import * as fiat from '~/assets/fiat.json'

interface FiatCurrency {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  emoji: string;
  name_plural: string;
  price: boolean;
}

interface Fiat {
  [key: string]: FiatCurrency;
}

export default defineComponent({
  data() {
    const fmap = fiat as unknown as Fiat
    return {
      valid: false,
      fiatAmount: 0,
      fiatCode: '',
      amount: 0,
      paymentMethod: '',
      isMarketPricing: true,
      buyerInvoice: '',
      fiatCurrencies: [...Object.keys(fiat).map(k => ({ title: `${k} ${fmap[k].emoji}`, fullName: `${fmap[k].name}`, value: k }))],
      selectedCurrency: null,
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
      type: Function as PropType<(arg: boolean) => boolean>,
      default: () => (arg: boolean) => false,
      required: true
    },
    orderType: {
      type: String,
      required: true,
      validator: (value: string) => ['Sell', 'Buy'].includes(value)
    }
  },
  mixins: [ invoiceValidator ],
  watch: {
    buyerInvoice(newValue) {
      // @ts-ignore
      this.decodedInvoice = {}
      try {
        // @ts-ignore
        this.decodedInvoice = bolt11.decode(newValue)
      } catch(err) {}
    }
  },
  mounted() {
    // For development only, this is so the dev doesn't have to
    // keep filling the form every time
    const config = useRuntimeConfig()
    if (config.public.nodeEnv === 'development') {
      this.fiatAmount = 5
      this.fiatCode = 'USD'
      this.paymentMethod = 'Cash'
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
      try {
        // @ts-ignore
        await this.$mostro.submitOrder(order)
        this.onClose()
      } catch(err) {
        console.error('Error while submitting order: ', err)
      } finally {
        this.onProcessingUpdate(false)
      }
    }
  },
  computed: {
    showInvoiceInput() {
      return !this.isMarketPricing && this.orderType === 'Buy'
    }
  }
})
</script>