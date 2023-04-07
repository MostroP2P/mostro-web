<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ on, attrs}">
      <v-btn text color="primary" v-bind="attrs" v-on="on">
        <v-icon left>
          mdi-qrcode-scan
        </v-icon>
        Show Invoice
      </v-btn>
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
      <v-card-text v-if="hasMessage && invoiceMode === 0" class="d-flex justify-center align-center mt-2">
        <qrcode-vue :value="message.content.PaymentRequest[1]" :size="300" level="H"/>
      </v-card-text>
      <v-card-text v-if="hasMessage && invoiceMode === 1" class="text-caption mt-2">
        {{ message?.content?.PaymentRequest[1] }}
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
import QrcodeVue from 'qrcode.vue'
import * as timeago from 'timeago.js'
import { Message } from '~/store/messages'

export default Vue.extend({
  components: {
    QrcodeVue
  },
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  data() {
    return {
      showDialog: false,
      invoiceMode: 0,
      timeago
    }
  },
  computed: {
    hasMessage() {
      return this.message &&
        this.message.content &&
        this.message.content.PaymentRequest
    }
  }
})
</script>