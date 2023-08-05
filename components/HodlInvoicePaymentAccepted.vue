<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Fiat Payment Needed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        🔒 The escrow deposit is secured.
      </p>
      <br>
      <p>
        Get in touch with the seller, user <npub :npub="sellerPubkey"/> to get the details on how to send the money, you must send {{ fiatCode }} {{ fiatAmount }} using {{ paymentMethod }}.
      </p>
      <br>
      <p>
        Once you send the money, please let me know by pressing the button below 👇
      </p>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType } from 'vue'
import { mapState } from 'pinia'
import { MostroMessage } from '~/stores/types'
import * as timeago from 'timeago.js'
import { useOrders } from '~/stores/orders'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
export default {
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
    ...mapState(useOrders, ['getOrderById']),
    sellerPubkey() {
      const smallOrder = this.message.content.SmallOrder
      if (smallOrder) {
        return smallOrder.seller_pubkey
      }
      return '?'
    },
    fiatCode() {
      const orderId = this.message.order_id
      const order = this.getOrderById(orderId)
      return order.fiat_code
    },
    fiatAmount() {
      const orderId = this.message.order_id
      const order = this.getOrderById(orderId)
      return order.fiat_amount
    },
    paymentMethod() {
      const orderId = this.message.order_id
      const order = this.getOrderById(orderId)
      return order.payment_method
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>