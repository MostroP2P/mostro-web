<template>
  <v-list-item three-line>
    <pay-invoice-message
      v-if="message.action === action.PayInvoice"
      :message="message"
    />
    <invoice-accepted-message
      v-if="message.action === action.InvoiceAccepted"
      :message="message"
    />
    <fiat-sent-message
      v-if="message.action === action.FiatSent"
      :message="message"
    />
    <sale-completed-message
      v-if="message.action === action.SaleCompleted"
      :message="message"
    />
  </v-list-item>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { MostroMessage } from '~/store/types'
import { Action } from '~/store/types'

export default Vue.extend({
  data() {
    return {
      showDialog: false,
      invoiceMode: 0,
      action: Action
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  }
})
</script>