<template>
  <v-dialog v-model="showDialog" width="600">
    <template v-slot:activator="{ props }">
      <v-btn
        icon="mdi-plus"
        size="x-large"
        density="comfortable"
        elevation="6"
        :disabled="!isAuthenticated"
        class="fixed-btn"
        v-bind="props">
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5">
        Add Order
      </v-card-title>
      <v-tabs v-model="tabs" color="accent">
        <v-tab>Sell</v-tab>
        <v-tab>Buy</v-tab>
      </v-tabs>
      <v-window v-model="tabs">
        <v-window-item>
          <v-card-text>
            <order-form
              :onClose="() => showDialog = false"
              :onProcessingUpdate="onProcessingUpdate"
              :orderType="OrderType.SELL"
            />
          </v-card-text>
        </v-window-item>
        <v-window-item>
          <v-card-text>
            <order-form
              :onClose="() => showDialog = false"
              :onProcessingUpdate="onProcessingUpdate"
              :orderType="OrderType.BUY"
            />
          </v-card-text>
        </v-window-item>
      </v-window>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { useAuth } from '@/stores/auth'
import { OrderType } from '@/stores/types'
const authStore = useAuth()
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<script lang="ts">
export default {
  data() {
    return {
      showDialog: false,
      isProcessing: false,
      tabs: null,
      OrderType,
    }
  },
  methods: {
    onProcessingUpdate(processing: boolean) {
      this.isProcessing = processing
    }
  }
}
</script>
<style scoped>
.fixed-btn {
  position: fixed;
  bottom: 2.5em;
  right: 24px;
}
</style>