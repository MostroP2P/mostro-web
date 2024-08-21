<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Not allowed by status
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>You are not allowed to perform this action because the order is not in the correct status.</p>
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