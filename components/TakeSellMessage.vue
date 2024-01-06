<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Waiting for your Invoice
      <div class="text-caption text--secondary">{{ creationDate }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      Please provide us with an invoice for {{ amount }} sats in order to continue.
    </v-list-item-subtitle>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { MostroMessage } from '~/stores/types'
import * as timeago from 'timeago.js'
export default defineComponent({
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    amount() {
      return this.message.content?.SmallOrder?.amount
    },
    creationDate() {
      return timeago.format(this.message.created_at * 1e3)
    }
  }
})
</script>