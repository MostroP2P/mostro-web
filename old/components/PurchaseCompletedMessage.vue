<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Purchase Completed!
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      🎉 Your sats sale has been completed after confirming the payment to your peer.
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import * as timeago from 'timeago.js'
import { MostroMessage } from '~/store/types'
export default Vue.extend({
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
})
</script>