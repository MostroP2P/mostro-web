<template>
  <v-card class="mx-auto" v-if="getMostroThreadSummaries.length > 0">
    <v-list>
      <div v-for="(threadSummary, index) in getMostroThreadSummaries" :key="threadSummary.orderId">
        <trade-header :threadSummary="threadSummary"/>
        <v-divider v-if="index < getMostroThreadSummaries.length - 1"/>
      </div>
    </v-list>
  </v-card>
  <div v-else class="text-subtitle2 d-flex justify-center align-center" style="height: 100vh">
    No trades yet
  </div>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { useMessages } from '~/stores/messages'
export default {
  computed: {
    ...mapState(useMessages, ['getMostroThreadSummaries'])
  }
}
</script>