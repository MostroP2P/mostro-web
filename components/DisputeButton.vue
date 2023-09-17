<template>
  <v-dialog v-model="showDialog" max-width="500">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text color="warning" prepend-icon="mdi-alert-outline" >
        Dispute
      </v-btn>
    </template>
    <v-card title="Confirm Dispute">
      <v-card-text>
        Please confirm you want to open a dispute for this trade.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="warning" @click="() => showDialog = false">
          Cancel
        </v-btn>
        <v-btn text color="info" @click="onConfirm">
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { ref } from 'vue'

const emit = defineEmits(['dispute'])

const showDialog = ref(false)

const onConfirm = () => {
  emit('dispute')
  showDialog.value = false
}
</script>