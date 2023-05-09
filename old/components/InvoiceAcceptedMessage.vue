<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Accepted
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        The user
        <npub :npub="buyerPubkey"/>
        has taken your order and wants to buy your sats. Get in touch and tell
        him/her how to send you {{ fiatAmount }} {{ fiatCode }} through {{ paymentMethod }}.
      </p>
      <p>
         Once you verify you have received the full amount you have to release the sats.
      </p>
    </div>
  </v-list-item-content>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { mapGetters } from 'vuex'
import { MostroMessage } from '~/store/types'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
import * as timeago from 'timeago.js'

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
    fiatAmount() {
      const smallOrder = this.message.content.SmallOrder
      if (smallOrder) {
        return smallOrder.fiat_amount
      }
      return NaN
    },
    fiatCode() {
      const smallOrder = this.message.content.SmallOrder
      if (smallOrder) {
        return smallOrder.fiat_code
      }
      return NaN
    },
    paymentMethod() {
      // @ts-ignore
      return this?.order?.payment_method
    },
    buyerPubkey() {
      const smallOrder = this.message.content.SmallOrder
      if (smallOrder) {
        return smallOrder.buyer_pubkey
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>