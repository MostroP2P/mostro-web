<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Payment needed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      <p>
        The escrow deposit is secured, you may now proceed to pay. Open a conversation with
        <npub :npub="sellerPubkey"/>
        and get the information on how to perform the fiat payment. Once this is done, press the "FIAT SENT" button below.
      </p>
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { MostroMessage } from '~/store/types'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
export default Vue.extend({
  data() {
    return {
      timeago
    }
  },
  components: {
    npub: NPub
  },
  mixins: [ textMessage ],
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  methods: {
    onPubkeyClick(sellerPubkey: string) {
      this.$router.push(`/messages/${sellerPubkey}`)
    }
  },
  computed: {
    sellerPubkey() {
      const smallOrder = this.message.content.SmallOrder
      if (smallOrder) {
        return smallOrder.seller_pubkey
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>