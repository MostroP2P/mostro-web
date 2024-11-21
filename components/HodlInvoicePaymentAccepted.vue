<template>
  <div>
    <v-list-item-title class="d-flex justify-space-between">
      Fiat Payment Needed
      <div class="text-caption text--secondary">
        <CreatedAt :creationDate="creationDate"/>
      </div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        🔒 The escrow deposit is secured.
      </p>
      <br>
      <p>
        Get in touch with the seller, user <npub :publicKey="sellerPubkey"/> to get the details on how to send the money, you must send {{ fiatCode }} {{ fiatAmount }} using {{ paymentMethod }}. The seller will provide you with the details on how to send the money.
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
import type { MostroMessage } from '~/utils/mostro/types'
import { useOrders } from '~/stores/orders'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
import CreatedAt from '~/components/CreatedAt.vue'
export default {
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
    sellerPubkey(): String {
      const order = this.message.order.content.order
      if (order) {
        return order.master_seller_pubkey || '??'
      }
      return '?'
    },
    fiatCode() {
      const orderId = this.message.order.content.order?.id
      if (orderId) {
        const order = this.getOrderById(orderId)
        if (order) {
          return order.fiat_code
        }
      }
      return '?'
    },
    fiatAmount() {
      const orderId = this.message.order.content.order?.id
      if (orderId) {
        const order = this.getOrderById(orderId)
        if (order) {
          return order.fiat_amount
        }
      }
      return '?'
    },
    paymentMethod() {
      const orderId = this.message.order.content.order?.id
      if (orderId) {
        const order = this.getOrderById(orderId)
        if (order) {
          return order.payment_method
        }
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
}
</script>