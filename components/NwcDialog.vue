<template>
  <v-dialog v-model="showDialog" width="500">
    <v-progress-linear v-if="isProcessing" indeterminate/>
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" outlined class="mt-4">
        <v-icon icon="mdi-power-plug-outline" class="mr-3"/>
        Setup NWC
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Setup Nostr Wallet Connect</v-card-title>
      <v-card-text>
        Enter your NWC connection string.
      </v-card-text>
      <v-row class="mx-4 my-5">
        <v-text-field
          v-model="connectionString"
          outlined
          label="Connection String"
          :disabled="isProcessing"
          :rules="[v => !!v || 'Connection string is required']"
        />
      </v-row>
      <v-row class="mx-4 mb-5">
        <v-spacer/>
        <v-btn
          color="primary"
          :disabled="!connectionString || isProcessing"
          @click="onSave"
        >
          Save
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
const authStore = useAuth()
const showDialog = ref(false)
const connectionString = ref('')
const isProcessing = ref(false)

const onSave = async () => {
  isProcessing.value = true
  try {
    await authStore.setNwc(connectionString.value)
    showDialog.value = false
  } catch (error) {
    console.error('Failed to save NWC:', error)
  } finally {
    isProcessing.value = false
  }
}
</script> 