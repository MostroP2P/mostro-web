<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Payment failed
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>    
    <div class="wrap-text text-message">
      <p>Mostro wasn't able to pay the invoice. A few attempts will be made, but if it keeps failing you'll have to contact an admin to provide a new invoice.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  message: {
    type: Object as PropType<MostroMessage>,
    required: true
  }
})

const creationDate = computed(() => {
  return props.message.created_at * 1e3
})
</script>

<style>

</style>