<template>
  <div>
    <v-alert class="mb-2" title="Dispute" :text="message" type="warning" variant="tonal" icon="mdi-alert-octagram">
    </v-alert>
    <Chat :npub="mostroNpub" style="background-color: gray;" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PublicKeyType } from '~/plugins/02-mostro'

const message = 'A dispute has been started on this order. An admin user will reach ' +
  'out and ask questions about the order. Be prepared to provide evidence to back up your claim.'

const mostroNpub = computed(() => {
  const { $mostro } = useNuxtApp()
  return $mostro.getMostroPublicKey(PublicKeyType.NPUB)
})
</script>