<template>
  <div class="form-container">
  <v-form v-model="valid" ref="form">
    <v-autocomplete
      v-model="selectedFiat"
      ref="autocomplete"
      :items="fiatCurrencies"
      :item-value="item => item"
      label="Fiat code"
      outlined
      required
      auto-select-first
      @keydown.delete="clearSelectedFiat"
    >
      <template v-slot:item="{ props, item }">
        <v-list-item
          three-line
          v-bind="props"
          :title="getTitle(item.raw)"
          :subtitle="getFullName(item.raw)"
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
    <v-switch class="ml-2 mb-0"
      :disabled="!hasPriceFeed"
      v-model="isMarketPricing"
      inset
      color="info"
      hint="The pricing mechanism of this order"
      :label="isMarketPricing ? 'Market' : 'Fixed'"
    >
    </v-switch>
    <div
      v-if="isMarketPricing"
      class="text-caption mt-3 mb-8"
    >
      Premium or discount
    </div>
    <div class="d-flex justify-center">
      <v-slider
        v-if="isMarketPricing"
        class="px-0"
        :min="-10"
        :max="10"
        :step="1"
        density="compact"
        :hint="premium > 0 ? `Premium ${premium}%` : `Discount ${premium}%`"
        show-ticks
        tick-size="5"
        thumb-label="always"
        v-model="premium"
      >
        <template v-slot:prepend>
          <v-btn
            icon="mdi-minus"
            size="small"
            variant="text"
            @click="premium <= -10 ? premium = -10 : premium -= 1"
          ></v-btn>
        </template>
        <template v-slot:append>
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            @click="premium >= 10 ? premium = 10 : premium += 1"
          ></v-btn>
        </template>
      </v-slider>
    </div>
    <v-text-field
      v-if="showSatsInput"
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
      :rules="invoiceRules"
      label="Lightning Invoice without an amount"
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
        variant="text"
        @click="onClose"
      >
        Cancel
      </v-btn>
      <v-btn
        :disabled="!valid"
        color="success"
        variant="text"
        @click="onSubmit"
      >
        Submit
      </v-btn>
    </div>
  </v-form>
</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import * as bolt11 from 'light-bolt11-decoder'
import invoiceValidator, { type DecodedInvoice, type Section } from '~/mixins/invoice-validator'
import { OrderStatus, OrderPricingMode, OrderType } from '@/stores/types'
import type { FiatData, NewOrder } from '@/stores/types'
import fiat from '~/assets/fiat.json'

interface Fiat {
  [key: string]: FiatData;
}

export default defineComponent({
  data() {
    return {
      valid: false,
      fiatAmount: 0,
      selectedFiat: null as FiatData | null,
      amount: 0,
      premium: 0,
      paymentMethod: '',
      isMarketPricing: true,
      buyerInvoice: '',
      fiatCurrencies: ([...Object.values(fiat)] as FiatData[]).map((f: FiatData) => {
        return {
          ...f,
          title: `${f.code} ${f.emoji}`
        }
      }),
      fiatAmountRules: [
        (v: string) => !!v || 'Fiat amount is required',
        (v: string) => /\d+(?:-\d+)?$/.test(v) || 'Invalid value or range'
      ],
      amountRules: [
        (v: string) => Number(v) > 0 || 'Sats amount is required'
      ],
      invoiceRules: [
        (v: string) => !v || this.validateInvoice() || this.decodedInvoiceError || 'Invalid Lightning Network invoice'
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
      type: Function as PropType<(arg: boolean) => void>,
      default: () => (arg: boolean) => false,
      required: true
    },
    orderType: {
      type: String,
      required: true,
      validator: (value: OrderType) => [OrderType.SELL, OrderType.BUY].includes(value)
    }
  },
  mixins: [ invoiceValidator ],
  watch: {
    buyerInvoice(newValue: string) {
      this.decodedInvoice = null
      try {
        const decoded = bolt11.decode(newValue) as DecodedInvoice
        decoded.sectionsMap = new Map<string, Section>
        for (const section of decoded.sections) {
          decoded.sectionsMap.set(section.name, section)
        }
        this.decodedInvoice = decoded
      } catch(err : unknown) {
        this.decodedInvoice = null
        if (typeof err === 'object' && err !== null && 'message' in err) {
          this.decodedInvoiceError = err.message as string
        }
        // console.error('Error while decoding invoice: ', err)
      }
    },
    invoiceValueSats(newValue) {
      if (!isNaN(newValue)) {
        this.amount = newValue
      } else {
        this.amount = 0
      }
    }
  },
  mounted() {
    // For development only, this is so the dev doesn't have to
    // keep filling the form every time
    const config = useRuntimeConfig()
    if (config.public.nodeEnv === 'development') {
      this.fiatAmount = 5
      this.selectedFiat = this.fiatCurrencies.find((f: FiatData) => f.code === 'USD') || null
      this.paymentMethod = 'Cash'
    }
  },
  methods: {
    validate () {
      // @ts-ignore
      this.$refs.form.validate()
    },
    async onSubmit() {
      if (!this.selectedfiatCode) return
      this.onProcessingUpdate(true)
      const fiatAmount = typeof this.fiatAmount === 'number' ?
        this.fiatAmount : parseFloat(this.fiatAmount)
      let satsAmount = typeof this.amount === 'number' ?
        this.amount : parseInt(this.amount)
      // @ts-ignore
      const order: NewOrder = {
        kind: this.orderType === OrderType.SELL ? OrderType.SELL : OrderType.BUY,
        status: OrderStatus.PENDING,
        amount: 0,
        fiat_code: this.selectedfiatCode,
        fiat_amount: fiatAmount,
        created_at: Math.ceil(Date.now() / 1E3),
        premium: this.premium,
        payment_method: this.paymentMethod
      }
      if (!this.isMarketPricing) {
        if (this.orderType === OrderType.BUY) {
          order.buyer_invoice = this.buyerInvoice !== '' ? this.buyerInvoice : null
        }
        // If the order is nor market-priced,
        // a fixed sats amount is required always
        order.amount = satsAmount
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
    },
    getTitle(item: FiatData) {
      return `${item.code} ${item.emoji}`
    },
    getFullName(item: FiatData) {
      return item.name
    },
    clearSelectedFiat() {
      this.selectedFiat = null
      // Reset the text field directly if necessary
      if (this.$refs.autocomplete) {
        // @ts-ignore
        const input = this.$refs.autocomplete.$el.querySelector('input')
        nextTick(() => {
          if (input) input.value = ''
        })
      }
    },
    validateInvoice() {
      let validInvoice = true
      if (!this.isInvoice) {
        validInvoice = false
        this.decodedInvoiceError = 'Not a valid invoice'
      }
      if (!this.isInvoiceNetwork) {
        validInvoice = false
        this.decodedInvoiceError = 'Invalid invoice network'
      }
      if (this.isExpired) {
        validInvoice = false
        this.decodedInvoiceError = 'Expired invoice'
      }
      if (this.hasAmount) {
        validInvoice = false
        this.decodedInvoiceError = 'Please provide an invoice without specified amount'
      }
      console.log('>> validInvoice: ', validInvoice)
      return validInvoice
    }
  },
  computed: {
    selectedfiatCode() {
      return this.selectedFiat?.code ? this.selectedFiat.code : null
    },
    hasPriceFeed() {
      const hasPriceFeed = this.selectedFiat?.price ?? false
      this.isMarketPricing = hasPriceFeed
      return hasPriceFeed
    },
    showInvoiceInput() {
      return !this.isMarketPricing && this.orderType === OrderType.BUY
    },
    showSatsInput() {
      return !this.isMarketPricing
    },
    hasSatsAmount() {
      return Number(this.amount) > 0 || !isNaN(this.invoiceValueSats)
    },
    hasInvoiceWithAmount() {
      if (this.decodedInvoice === null) {
        return false
      }
      return this.decodedInvoice.sectionsMap?.has('amount')
    },
  }
})
</script>

<style scoped>
.form-container {
  max-height: 50vh;
  overflow-y: auto;
}
</style>