<template>
  <div>
    <v-list-item-content>
      <v-list-item-title class="d-flex justify-space-between">
        Fiat Sent
        <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p>
          <code>
            <strong>
              <a @click="(e) => onPubkeyClick(e)">
                {{ isMobile ? truncateMiddle(buyerPubkey) : buyerPubkey }}
              </a>
            </strong>
          </code>
        has informed that already sent you the fiat money, once you confirmed you received it, please release funds. You will not be able to create another order until you release funds.
        </p>
      </div>
    </v-list-item-content>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import { Message } from '~/store/messages'
import textMessage from '~/mixins/text-message'
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
      const peer = this.message.content.Peer
      if (peer) {
        return peer.pubkey
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>