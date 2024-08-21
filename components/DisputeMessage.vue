<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      <div>
        Dispute
      </div>
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>    
    <div class="wrap-text text-message">
      <p>{{ message }}.</p>
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

const message = computed(() => {
  switch (props.message.order.action) {
    case Action.DisputeInitiatedByYou:
      return 'You initiated a dispute, please head to the dispute tab to resolve'
    case Action.DisputeInitiatedByPeer:
      return 'Peer initiated a dispute, please head to the dispute tab to resolve'
    default:
      return ''
  }
})

</script>

<style>

</style>