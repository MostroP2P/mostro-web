<template>
  <div>
    <Chat :npub="npub"/>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
const npub = ref(route.params.npub)
definePageMeta({
  layout: 'message-list'
})
</script>