<template>
  <div style="width: 100%">
    <div>
      <v-list-item-title class="d-flex justify-space-between">
        Rate User
        <div class="text-caption text--secondary">
          <CreatedAt :creationDate="creationDate"/>
        </div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p>Please rate your peer.</p>
      </div>
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
        <v-btn variant="text">Rate</v-btn>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import type { MostroMessage } from '~/stores/types'
import CreatedAt from '~/components/CreatedAt.vue'
export default {
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
}
</script>