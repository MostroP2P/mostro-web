<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Payment Accepted
      <div class="text-caption text--secondary">{{ creationDate }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      Your escrow payment has been accepted, we're waiting for the buyer to provide an invoice now.
    </v-list-item-subtitle>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { MostroMessage } from '~/stores/types'
import * as timeago from 'timeago.js'
export default {
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    creationDate() {
      return timeago.format(this.message.created_at * 1e3)
    }
  }
}
</script>