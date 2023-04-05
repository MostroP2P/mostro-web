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
  </v-list-item>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { Message } from '~/store/messages'
import { Action } from '~/store/action'

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
      type: Object as PropType<Message>,
      required: true
    }
  }
})
</script>