<template>
  <div style="width: 100%">
    <v-list-item-content>
      <v-list-item-title class="d-flex justify-space-between">
        Rate User
        <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
      </v-list-item-title>
      <v-list-item-subtitle class="wrap-text text-message">
        <p>Please rate your peer.</p>
      </v-list-item-subtitle>
      <v-rating
        color="warning"
        length="5"
        size="32"
        hover
        dense
        light
        :value="3"
      >
      </v-rating>
      <div>
        <v-btn text>Rate</v-btn>
      </div>
    </v-list-item-content>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import { MostroMessage } from '~/store/types'
export default Vue.extend({
  data() {
    return { timeago }
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