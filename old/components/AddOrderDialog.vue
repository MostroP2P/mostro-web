<template>
  <v-dialog v-model="showDialog" width="600">
    <template v-slot:activator="{on, attrs}">
      <v-btn fab absolute right bottom color="accent" class="mb-5 mr-5" v-bind="attrs" v-on="on">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5">
        Add Order
      </v-card-title>
      <v-tabs v-model="tabs">
        <v-tab>Sell</v-tab>
        <v-tab>Buy</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tabs">
        <v-tab-item>
          <v-card-text>
            <order-form
              :onClose="() => showDialog = false"
              :onProcessingUpdate="onProcessingUpdate"
              orderType="Sell"
            />
          </v-card-text>
        </v-tab-item>
        <v-tab-item>
          <v-card-text>
            <order-form
              :onClose="() => showDialog = false"
              :onProcessingUpdate="onProcessingUpdate"
              orderType="Buy"
            />
          </v-card-text>
        </v-tab-item>
      </v-tabs-items>
      <v-progress-linear v-if="isProcessing" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      showDialog: false,
      isProcessing: false,
      tabs: null
    }
  },
  methods: {
    onProcessingUpdate(processing: boolean) {
      this.isProcessing = processing
    }
  }
})
</script>