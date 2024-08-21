<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Admin took dispute
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>    
    <div class="wrap-text text-message">
      <p>An admin took the dispute.</p>
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