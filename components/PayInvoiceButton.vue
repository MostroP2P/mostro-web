<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ props }">
      <v-btn text color="success" v-bind="props" prepend-icon="mdi-qrcode-scan">
        Show Invoice
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-title">
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
          color="accent"
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
import type { PropType } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { MostroMessage } from '~/stores/types'

export default {
  components: {
    QrcodeVue
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  data() {
    return {
      showDialog: false,
      invoiceMode: 0
    }
  },
  computed: {
    hasMessage() : boolean {
      return this.message &&
        this.message.content &&
        this.message.content.PaymentRequest !== undefined
    }
  }
}
</script>