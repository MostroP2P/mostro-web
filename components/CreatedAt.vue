<template>
  <v-tooltip :text="date.toLocaleString()">
    <template v-slot:activator="{ props }">
      <div v-bind="props" class="text-caption text--secondary">
        {{ timeAgo }}
      </div>    
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
import * as timeago from 'timeago.js'

const props = defineProps({
  creationDate: {
    type: Number,
    required: true
  }
})
// Dummy variable used to trigger update
const triggerUpdate = ref(0)

const timeAgo = computed(() => {
  // Access triggerUpdate to establish a dependency, even though we don't use its value
  triggerUpdate.value
  return timeago.format(props.creationDate)
})
const date = ref(new Date(props.creationDate))

onMounted(() => {
  const interval = setInterval(() => {
    triggerUpdate.value++
  }, 1E3)

  onBeforeUnmount(() => {
    clearInterval(interval)
  })
})

</script>

