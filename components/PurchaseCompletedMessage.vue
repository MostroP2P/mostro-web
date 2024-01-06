<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Purchase Completed!
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      🎉 Your sats sale has been completed after confirming the payment to your peer.
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import type { MostroMessage } from '~/stores/types'
export default {
  data() {
    return {
      timeago
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>