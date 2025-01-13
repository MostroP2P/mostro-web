<template>
  <div>
    <v-alert class="mb-2" title="Dispute" :text="message" :type="color" variant="tonal" icon="mdi-alert-octagram">
    </v-alert>
    <Chat v-if="solverNpub" :npub="solverNpub" :enabled="chatEnabled" style="background-color: gray;" />
    <div v-else class="d-flex align-center justify-center fill-height">
      <div class="text-center">
        <v-icon
          size="64"
          color="info"
          class="mb-4"
        >
          mdi-account-question
        </v-icon>
        <h3 class="text-h6 text-info mb-2">No Solver Assigned</h3>
        <p class="text-body-1 text-medium-emphasis">
          Please wait while an administrator is assigned to your dispute.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisputes } from '~/stores/disputes'
import { PublicKeyType } from '~/utils/mostro'

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
  if (dispute.value.status === DisputeStatus.INITIATED) {
    return 'A dispute has been started on this order. An admin user will reach ' +
          'out and ask questions about the order. Be prepared to provide evidence ' +
          'to back up your claim.'
  } else if (dispute.value.status === DisputeStatus.IN_PROGRESS) {
    return 'A dispute is currently in progress. ' +
          'Please reply to the admin and provide evidence to back up your claim.'
  } else if (dispute.value.status === DisputeStatus.SETTLED) {
    return 'The admin/solver has settled the dispute. The buyer has won the dispute.'
  } else if (dispute.value.status === DisputeStatus.CANCELED) {
    return 'The admin/solver has canceled the dispute. The seller has won the dispute.'
  }
})
</script>