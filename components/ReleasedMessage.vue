<template>
  <div style="width: 100%">
    <div>
      <v-list-item-title class="d-flex justify-space-between">
        Sats Released!
        <div class="text-caption text--secondary">
          <CreatedAt :creationDate="creationDate"/>
        </div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p>
          🕐 <npub v-if="sellerPubkey" :publicKey="sellerPubkey"/> already released the satoshis, expect your invoice to be paid any time, remember your wallet needs to be online to receive through lighntning network.
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { mapState } from 'pinia'
import { useRoute } from 'vue-router'
import type { MostroMessage, Order } from '~/utils/mostro/types'
import { useOrders } from '@/stores/orders'
import NPub from '~/components/NPub.vue'
export default {
  data() {
    return {
      route: useRoute()
    }
  },
  components: {
    npub: NPub
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderById']),
    order() : Order | undefined {
      const orderId = this.route?.params?.id as string
      if (!orderId) return undefined
      return this.getOrderById(orderId)
    },
    sellerPubkey() {
      return this.order?.master_seller_pubkey
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>