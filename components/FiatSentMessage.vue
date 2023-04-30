<template>
  <div style="width: 100%">
    <v-list-item-content>
      <v-list-item-title class="d-flex justify-space-between">
        Fiat Sent
        <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p v-if="isLocalBuyer">
          🧌 I told <npub :npub="sellerPubkey"/> that you have sent fiat money once the seller confirms the money was received, the sats should be sent to you.
        </p>
        <p v-if="!isLocalBuyer">
          <npub :npub="buyerPubkey"/> has informed that already sent you the fiat money, once you confirmed you received it, please release funds. You will not be able to create another order until you release funds.
        </p>
      </div>
    </v-list-item-content>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import { MostroMessage } from '~/store/types'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
export default Vue.extend({
  data() {
    return { timeago }
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
    onPubkeyClick(buyerPubkey: string) {
      this.$router.push(`/messages/${buyerPubkey}`)
    }
  },
  computed: {
    ...mapGetters('orders', ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    buyerPubkey() {
      // @ts-ignore
      return this.message?.content?.Peer?.pubkey ?? '?'
    },
    sellerPubkey() {
      // @ts-ignore
      return this.order?.seller_pubkey
    },
    isLocalBuyer() {
      // @ts-ignore
      return this?.$mostro?.getNpub() === this.order?.buyer_pubkey
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>