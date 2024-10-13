<template>
  <v-dialog width="500" v-model="showDialog">
    <template v-slot:activator="{ props }">
      <v-btn :disabled="order.is_mine" color="success" variant="outlined" v-bind="props" class="my-0">
        Take
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Take Sell Order</v-card-title>
      <v-card-text>
        Confirm that you want buy sats. Mostro will ask you to provide an invoice.
      </v-card-text>
      <v-card-text v-if="isRangeOrder">
        This is a range order. Before confirming you also need to specify an amount between {{ order.min_amount }} and {{ order.max_amount }} {{ order.fiat_code.toUpperCase() }}.
      </v-card-text>
      <v-card-text v-if="isRangeOrder">
        <v-form v-model="isFormValid">
          <v-text-field v-model="amount" label="Amount" type="number" :rules="rangeAmountRules"/>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" color="warning" @click="() => showDialog = false">
          Cancel
        </v-btn>
        <v-btn variant="text" color="success" @click="onConfirm" :disabled="!isFormValid && isRangeOrder">
          Confirm
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import { Order } from '~/stores/types'
import { useRouter } from 'vue-router'
import type { Mostro } from '~/plugins/02-mostro'

const props = defineProps({
  order: {
    type: Object as PropType<Order>,
    required: true
  }
})

const router = useRouter()

const isFormValid = ref(false)
const showDialog = ref(false)
const isProcessing = ref(false)
const amount = ref<string | null>(null)

const onConfirm = async () => {
  isProcessing.value = true
  try {
    const { $mostro } = useNuxtApp()
    await ($mostro as Mostro).takeSell(
      props.order,
      amount.value ? Number(amount.value) : undefined
    )
    router.push(`/my-trades/${props.order.id}`)
  } catch(err) {
    console.error('Error while confirming sell order: ', err)
  } finally {
    isProcessing.value = false
    showDialog.value = false
  }
}

const isRangeOrder = computed(() => {
  return props.order.min_amount !== null && props.order.max_amount !== null
})

const rangeAmountRules = computed(() => {
  return [
    (v: string) => !!v || 'Amount is required',
    (v: string) => {
      if (props.order.min_amount && props.order.max_amount) {
        if (Number(v) < props.order.min_amount || Number(v) > props.order.max_amount) {
          return `Amount must be between ${props.order.min_amount} and ${props.order.max_amount}`
        }
      } else {
        return 'Invalid order range'
      }
      return true
    }
  ]
})
</script>
