<template>
  <div>
    <v-alert class="mb-2" title="Dispute" :text="message" :type="color" variant="tonal" icon="mdi-alert-octagram">
    </v-alert>
    <Chat :npub="solverNpub" :enabled="chatEnabled" style="background-color: gray;" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PublicKeyType } from '~/plugins/02-mostro'
import { useDisputes } from '~/stores/disputes'

const disputeStore = useDisputes()
const route = useRoute()

const color = computed(() => {
  if (!dispute.value) return 'info'
  if (dispute.value.status === 'initiated') {
    return 'warning'
  } else if (dispute.value.status === 'in-progress') {
    return 'info'
  } else {
    return 'success'
  }
})

const chatEnabled = computed(() => {
  return dispute.value?.status === DisputeStatus.IN_PROGRESS
})

const solverNpub = computed(() => {
  if (!dispute.value || dispute.value.status === DisputeStatus.INITIATED) {
    return null
  }
  const { $mostro } = useNuxtApp()
  return $mostro.getMostroPublicKey(PublicKeyType.NPUB)
})

const dispute = computed(() => {
  const orderId = route.params.id
  return disputeStore.getDisputeByOrderId(orderId)
})

const message = computed(() => {
  if (!dispute || !dispute.value) return ''
  if (dispute.value.status === 'initiated') {
    return 'A dispute has been started on this order. An admin user will reach ' +
          'out and ask questions about the order. Be prepared to provide evidence ' +
          'to back up your claim.'
  } else if (dispute.value.status === 'in-progress') {
    return 'A dispute is currently in progress. ' +
          'Please reply to the admin and provide evidence to back up your claim.'
  } else if (dispute.value.status === 'settled-by-admin') {
    return 'The admin/solver has settled the dispute. The buyer has won the dispute.'
  } else if (dispute.value.status === 'canceled-by-buyer') {
    return 'The admin/solver has canceled the dispute. The seller has won the dispute.'
  }
})
</script>