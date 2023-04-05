<template>
  <v-dialog v-model="showDialog" width="500">
    <template v-slot:activator="{ on, attrs}">
      <v-btn text color="primary" v-on="on" v-bind="attrs">
        <v-icon left>fa-regular fa-dove</v-icon>
        Release
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Are you sure?</v-card-title>
      <v-card-text>
        You will be releasing the funds to your counterparty, please make sure you got your fiat correctly.
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn
          color="secondary"
          text
          @click="showDialog = false"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text
          @click="release"
        >
          <v-icon left>mdi-thumb-up</v-icon>
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>

  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      showDialog: false
    }
  },
  methods: {
    release() {
      
    }
  }
})
</script>