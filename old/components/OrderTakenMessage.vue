<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Trade Started
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      {{ orderTakenMessage }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import { mapGetters } from 'vuex'
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
    ...mapGetters('orders', ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    orderTakenMessage() {
      if (this.order.is_mine) {
        return 'Your sell order was taken'
      } else {
        return 'You just took a sell order'
      }

    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>