<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ props }">
      <v-btn variant="text" color="success" v-bind="props" prepend-icon="mdi-qrcode-scan" class="mx-2" min-width="160">
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
        <qrcode-vue :margin="5" :value="getInvoice()" :size="330" level="L" class="qr-code"/>
      </v-card-text>
      <v-card-text v-if="hasMessage && invoiceMode === 1" class="text-caption mt-2 invoice">
        {{ getInvoice() }}
      </v-card-text>
      <v-card-text class="d-flex justify-center align-center">
        <v-btn icon="mdi-content-copy" variant="tonal" class="ml-2" @click="onCopyInvoice"/>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="accent"
          variant="text"
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
import type { MostroMessage } from '~/utils/mostro/types'

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
  methods: {
    getInvoice() {
      if (
        this.message.order &&
        this.message.order.payload &&
        this.message.order.payload.payment_request
      ) {
        return this.message.order.payload.payment_request[1]
      }
      return ''
    },
    async onCopyInvoice() {
      const invoice = this.getInvoice()
      if (invoice) {
      try {
        await navigator.clipboard.writeText(invoice)
        // Show a success message or perform any other desired action
        console.log('Invoice copied to clipboard')
      } catch (err) {
        // Handle any errors that occurred during copying
        console.error('Failed to copy invoice: ', err)
      }
      }
    }
  },
  computed: {
    hasMessage() : boolean {
      return this.message?.order?.payload?.payment_request !== undefined
    }
  }
}
</script>
<style scoped>
.qr-code {
  border-radius: 10px;
}
.invoice {
  font-weight: bold;
}
</style>

