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
      <v-card-text v-if="hasMessage && invoiceMode === 1" class="text-caption mt-2">
        {{ getInvoice() }}
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
import type { MostroMessage } from '~/stores/types'

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
        this.message.order.content &&
        this.message.order.content.payment_request
      ) {
        return this.message.order.content.payment_request[1]
      }
      return ''
    }
  },
  computed: {
    hasMessage() : boolean {
      return this.message &&
        this.message.order.content &&
        this.message.order.content.payment_request !== undefined
    }
  }
}
</script>
<style scoped>
.qr-code {
  border-radius: 10px;
}
</style>

