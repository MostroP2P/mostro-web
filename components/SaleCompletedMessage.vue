<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Sale Completed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        Your sale of sats has been completed after confirming payment from
        <code>
          <strong>
            <a @click="(e) => onPubkeyClick(e)">
              {{ isMobile ? truncateMiddle(buyerPubkey) : buyerPubkey  }}
            </a>
          </strong>
        </code>
      </p>
    </div>
  </v-list-item-content>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'
import { Message } from '~/store/messages'

export default Vue.extend({
  data() {
    return { timeago }
  },
  mixins: [ textMessage ],
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  methods: {
    onPubkeyClick(e: any) {
      // TODO: send the user to /messages/{npub}
    }
  },
  computed: {
    buyerPubkey() {
      const saleCompleted = this.message.content.SaleCompleted
      console.log('this.message: ', this.message)
      if (saleCompleted) {
        return saleCompleted.buyer
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>