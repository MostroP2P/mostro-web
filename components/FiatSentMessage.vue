<template>
  <div style="width: 100%">
    <div>
      <v-list-item-title class="d-flex justify-space-between">
        Fiat Sent
        <div class="text-caption text--secondary">
          <CreatedAt :creationDate="creationDate"/>
        </div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        <p v-if="isLocalBuyer">
          🧌 I told <npub :publicKey="sellerPubkey"/> that you have sent fiat money once the seller confirms the money was received, the sats should be sent to you.
        </p>
        <p v-if="isLocalSeller">
          <npub :publicKey="buyerPubkey"/> has informed that already sent you the fiat money, once you confirmed you received it, please release funds. You will not be able to create another order until you release funds.
        </p>
        <p v-else>
          Fiat sent
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapState } from 'pinia'
import { useOrders } from '@/stores/orders'
import type { PropType } from 'vue'
import * as timeago from 'timeago.js'
import { nip19 } from 'nostr-tools'
import type { MostroMessage } from '~/stores/types'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
import CreatedAt from '~/components/CreatedAt.vue'
export default {
  data() {
    const authStore = useAuth()
    return { timeago, pubkey: authStore.pubKey }
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
    order() {
      const route = useRoute()
      return this.getOrderById(route.params.id as string)
    },
    buyerPubkey() {
      return this.order?.master_buyer_pubkey
    },
    sellerPubkey() {
      return this.order?.master_seller_pubkey
    },
    isLocalBuyer() {
      try {
        const masterBuyerPubKey = this.order?.master_buyer_pubkey
        if (!masterBuyerPubKey) return false
        return this.pubkey === masterBuyerPubKey
      } catch (err) {
        console.error('Error checking if local buyer: ', err)
      }
      return false
    },
    isLocalSeller() {
      try {
        const masterSellerPubKey = this.order?.master_seller_pubkey
        if (!masterSellerPubKey) return false
        return this.pubkey === masterSellerPubKey
      } catch (err) {
        console.error('Error checking if local seller: ', err)
      }
      return false
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>
