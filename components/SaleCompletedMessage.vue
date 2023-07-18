<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Sale Completed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle class="wrap-text text-message">
      <p>
        Your sale of sats has been completed after confirming payment from
        <npub :npub="buyerPubkey"/>
      </p>
    </v-list-item-subtitle>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'
import { MostroMessage } from '~/stores/types'
import { useOrders } from '@/stores/orders'
import NPub from '~/components/NPub.vue'
import { mapState } from 'pinia'

export default {
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
    ...mapState(useOrders, ['getOrderById']),
    buyerPubkey() {
      const { order_id } = this.message
      // @ts-ignore
      const buyerPubkey = this.getOrderById(order_id).buyer_pubkey
      return buyerPubkey ? buyerPubkey : '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>