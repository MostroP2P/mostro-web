<template>
  <v-dialog v-model="showDialog" width="600">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" variant="text" prepend-icon="mdi-cash" class="mx-2" min-width="160">
        Fiat Sent
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        Confirm
      </v-card-title>
      <v-card-text>
        I confirm that I've sent {{ fiatAmount }} {{ fiatCode?.toUpperCase() }} to
        <npub :publicKey="sellerPubkey"/>
        .
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" color="warning" @click="showDialog = false">
          Cancel
        </v-btn>
        <v-btn variant="text" color="success" @click="onConfirm">
          Confirm
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isLoading" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { ref, computed } from 'vue'
import { useOrders } from '~/stores/orders'
import { useRoute, useRouter } from 'vue-router'
import NPub from '~/components/NPub.vue'
import { Mostro } from 'plugins/02-mostro'

export default {
  components: {
    npub: NPub
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const nuxt = useNuxtApp()
    const vueApp = nuxt.vueApp
    const $mostro = vueApp.config.globalProperties.$mostro as Mostro
    const { getOrderById } = useOrders()
    const showDialog = ref(false)
    const isLoading = ref(false)

    const order = computed(() => getOrderById(route.params.id as string))
    const fiatAmount = computed(() => order.value?.fiat_amount)
    const fiatCode = computed(() => order.value?.fiat_code)
    const sellerPubkey = computed(() => order.value?.master_seller_pubkey ?? '')

    const onConfirm = async () => {
      isLoading.value = true
      try {
        await $mostro.fiatSent(order.value)
        showDialog.value = false
      } catch(err) {
        console.error('Error issuing the fiatSent message: ', err)
      } finally {
        isLoading.value = false
      }
    }

    const onPubkeyClick = (sellerPubkey: string) => {
      router.push(`/messages/${sellerPubkey}`)
    }

    return {
      showDialog,
      isLoading,
      onConfirm,
      onPubkeyClick,
      order,
      fiatAmount,
      fiatCode,
      sellerPubkey
    }
  }
}
</script>
