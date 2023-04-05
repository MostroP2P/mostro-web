<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ on, attrs}">
      <v-list-item-content>
        <v-list-item-title class="d-flex justify-space-between">
          Order taken
          <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ messageText }}
        </v-list-item-subtitle>
        <v-list-item-subtitle class="d-flex justify-space-between">
          Please pay this invoice to start up your selling process, it will expire in 15 minutes
          <v-btn text color="primary" v-bind="attrs" v-on="on">
            <v-icon left>
              mdi-qrcode-scan
            </v-icon>
            Show Invoice
          </v-btn>
        </v-list-item-subtitle>
      </v-list-item-content>
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
import { Message } from '~/store/messages'
import QrcodeVue from 'qrcode.vue'
import * as timeago from 'timeago.js'
export default Vue.extend({
  data() {
    return {
      showDialog: false,
      invoiceMode: 0,
      timeago
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
  computed: {
    messageText() {
      // @ts-ignore
      return `Somebody wants to buy you ${this.satsAmount} sats for ${this.fiatCode} ${this.fiatAmount}`
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
      return 'N/A'
    },
    fiatAmount() {
      const paymentRequest = this.message.content.PaymentRequest
      if (paymentRequest && Array.isArray(paymentRequest)) {
        // @ts-ignore
        return paymentRequest[0].fiat_amount
      }
      return 'N/A'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>