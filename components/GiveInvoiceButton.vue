<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ props }">
      <v-btn variant="text" color="accent" v-bind="props" prepend-icon="mdi-flash" class="mx-2" min-width="160">
        <template v-slot:prepend>
          <v-icon color="success"></v-icon>
        </template>
        Enter Invoice
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-title">
        Buyer Action Required
      </v-card-title>
      <v-card-text>
        Please give us an invoice for <strong>{{ satsAmount }}</strong> sats.
      </v-card-text>
      <v-textarea
        v-model="invoice"
        rows="7"
        outlined
        class="mx-5"
        :error="invoiceError"
        :error-messages="invoiceErrorMessages"
        :hint="invoiceHint"
      />
      <v-card-actions class="mx-3 mb-3">
        <v-btn color="warning" variant="text" @click="close" class="px-3">
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn :disabled="submitDisabled" color="success" variant="text" @click="submitInvoice" append-icon="mdi-send" class="px-3">
          Submit
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import type { MostroMessage } from '~/stores/types'
import type { Mostro } from '~/plugins/02-mostro'
import { useOrders } from '~/stores/orders'
import { useBolt11Parser } from '~/composables/useInvoice'
import { useMostroStore } from '~/stores/mostro'

export default defineComponent({
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  setup(props) {
    const showDialog = ref(false)
    const invoice = ref('')
    const isProcessing = ref(false)
    const nuxtApp = useNuxtApp()
    const mostro = nuxtApp.$mostro as Mostro
    const orderStore = useOrders()
    const mostroStore = useMostroStore()
    const { error, parseInvoice } = useBolt11Parser()
    const order = computed(() => {
      return orderStore.getOrderById(props.message.order.content.order?.id ?? '')
    })
    const mostroInfo = mostroStore.getMostroInfo(order.value?.mostro_id ?? '')

    const invoiceError = computed(() => {
      return error.value !== undefined
    })

    const invoiceErrorMessages = computed(() => {
      return error.value
    })

    const submitInvoice = async () => {
      if (!order || !order.value) {
        console.error('No order found for invoice')
        return
      }
      try {
        await mostro.addInvoice(order.value, invoice.value)
      } catch(err) {
        console.error('Error while giving invoice for buy order: ', err)
      } finally {
        isProcessing.value = false
        invoice.value = ''
        showDialog.value = false
      }
    }

    const close = () => {
      invoice.value = ''
      showDialog.value = false
    }

    watch(invoice, (newValue) => {
      const params = {
        minExpiry: mostroInfo.invoice_expiration_window,
        expectedMsats: BigInt(satsAmount.value) * BigInt(1e3)
      }
      try {
        parseInvoice(newValue, params)
      } catch(err) {
        console.error('Error while decoding invoice: ', err)
      }
    })

    const invoiceHint = computed(() => {
      return invoice.value === '' ? 'Enter a valid BOLT11 invoice' : ''
    })

    const satsAmount = computed(() => {
      return props.message.order.content.order?.amount ?? '?'
    })

    const submitDisabled = computed(() => {
      return error.value !== undefined || !invoice.value
    })

    return {
      showDialog,
      invoice,
      invoiceError,
      isProcessing,
      submitInvoice,
      close,
      invoiceHint,
      satsAmount,
      invoiceErrorMessages,
      submitDisabled,
      mostroInfo
    }
  }
})
</script>