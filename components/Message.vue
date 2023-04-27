<template>
  <v-list-item three-line>
    <pay-invoice-message
      v-if="message.action === action.PayInvoice"
      :message="message"
    />
    <invoice-accepted-message
      v-if="message.action === action.BuyerTookOrder"
      :message="message"
    />
    <fiat-sent-message
      v-if="message.action === action.FiatSent"
      :message="message"
    />
    <sale-completed-message
      v-if="message.action === action.HoldInvoicePaymentSettled"
      :message="message"
    />
    <waiting-seller-to-pay
      v-if="message.action === action.WaitingSellerToPay"
      :message="message"
    />
    <add-invoice-message
      v-if="message.action === action.AddInvoice"
      :message="message"
    />
    <hodl-invoice-payment-accepted
      v-if="message.action === action.HoldInvoicePaymentAccepted"
      :message="message"
    />
    <released-message
      v-if="message.action === action.Release"
      :message="message"
    />
  </v-list-item>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import type { PropType } from 'vue'
import { MostroMessage } from '~/store/types'
import { Action } from '~/store/types'

export default Vue.extend({
  data() {
    return {
      action: Action
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    ...mapGetters('orders', ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    isLocalBuyer() {
      // @ts-ignore
      return this?.$mostro?.getNpub() === this.order?.buyer_pubkey
    },
  }
})
</script>