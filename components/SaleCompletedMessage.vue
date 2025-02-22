<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Sale Completed
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        Your sale of sats has been completed after confirming payment from
        <npub :publicKey="buyerPubkey"/>
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'
import type { MostroMessage } from '~/utils/mostro/types'
import { useOrders } from '@/stores/orders'
import CreatedAt from '~/components/CreatedAt.vue'
import NPub from '~/components/NPub.vue'
import { mapState } from 'pinia'

export default {
  data() {
    return { timeago }
  },
  components: {
    npub: NPub,
    CreatedAt
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
      try {
        const orderMessage = this.message.order
        if (!orderMessage) {
          console.warn(`Order message not found in SaleCompletedMessage`)
          return 'N/A'
        }
        const storedOrder = this.getOrderById(orderMessage.id as string)
        if (!storedOrder) {
          console.warn(`Order with id ${orderMessage.id} not found`)
          return 'N/A'
        }
        const buyerPubkey = storedOrder.buyer_trade_pubkey
        return buyerPubkey ? buyerPubkey : '?'
      } catch (error) {
        console.error('Error in buyerPubkey:', error)
        return 'N/A'
      }
    },
    creationDate() {
      return this.message.created_at ? this.message.created_at * 1e3 : 'N/A'
    }
  }
}
</script>