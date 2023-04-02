<template>
  <v-card class="mx-auto" v-if="getThreadSummaries.length > 0">
    <v-list>
      <div v-for="(threadSummary, index) in getThreadSummaries" :key="threadSummary.orderId">
        <thread-header :threadSummary="threadSummary"/>
        <v-divider v-if="index < getThreadSummaries.length - 1"/>
      </div>
    </v-list>
  </v-card>
  <div v-else class="text-subtitle2 d-flex justify-center align-center" style="height: 100vh">
    No messages yet
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
export default Vue.extend({
  computed: {
    ...mapGetters('messages', ['getThreadSummaries'])
  }
})
</script>