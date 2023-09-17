<template>
  <Chat :npub="mostroNpub" style="background-color: gray;"/>
</template>

<script setup>
import { computed } from 'vue'
import { PublicKeyType } from '~/plugins/02-mostro'

const mostroNpub = computed(() => {
  const { $mostro } = useNuxtApp()
  return $mostro.getMostroPublicKey(PublicKeyType.NPUB)
})
</script>