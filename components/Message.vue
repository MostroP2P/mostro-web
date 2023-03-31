<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ on, attrs} ">
      <v-list-item
        v-on="on"
        v-bind="attrs"
        three-line
        link
      >
        <v-list-item-content>
          <v-list-item-title>Order taken!</v-list-item-title>
          <v-list-item-subtitle>
            {{ getMessageText(message)}}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Please pay this invoice to start up your selling process, it will expire in 15 minutes
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon
            color="yellow darken-2"
          >
            fa-regular fa-bolt
          </v-icon>
        </v-list-item-action>
      </v-list-item>
    </template>
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        Seller Action Required
      </v-card-title>
      <v-card-text>
        Please pay this invoice to start up your selling process, it will expire in 15 minutes
      </v-card-text>
      <div class="d-flex justify-center">
        <v-btn-toggle v-model="invoiceMode">
          <v-btn>
            <v-icon>mdi-qrcode</v-icon>
          </v-btn>
          <v-btn>
            <v-icon>mdi-format-align-center</v-icon>
          </v-btn>
        </v-btn-toggle>
      </div>
      <v-card-text v-if="invoiceMode === 0" class="d-flex justify-center align-center mt-2">
        <qrcode-vue :value="message.content.PaymentRequest[1]" :size="300" level="H"/>
      </v-card-text>
      <v-card-text v-if="invoiceMode === 1" class="text-caption mt-2">
        {{ message.content.PaymentRequest[1] }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text
          @click="showDialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { Order } from '~/store/orders'
import { Message } from '~/store/messages'
import { Action } from '~/store/action'
import QrcodeVue from 'qrcode.vue'

export default Vue.extend({
  data() {
    return {
      showDialog: false,
      invoiceMode: 0
    }
  },
  components: {
    QrcodeVue
  },
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  methods: {
    getMessageText(message: Message) {
      switch(message.action) {
        case Action.PayInvoice:
          // @ts-ignore
          return `Somebody wants to buy you ${this.satsAmount} sats for ${this.fiatCode} ${this.fiatAmount}` //${message.content.PaymentRequest[1]}
        default:
          return 'Unimplemented message 😥'
      }
    },
  },
  computed: {
    fiatAmount() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].fiat_amount
      }
      return 'N/A'
    },
    satsAmount() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].amount
      }
    },
    fiatCode() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].fiat_code
      }
    }
  }
})
</script>