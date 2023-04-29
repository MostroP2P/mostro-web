<template>
  <div style="width: 100%">
    <v-list-item-content>
      <v-list-item-title class="d-flex justify-space-between">
        Sats Released!
        <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
      </v-list-item-title>
      <div class="wrap-text text-message">
        🕐 <npub v-if="sellerPubkey" :npub="sellerPubkey"/> already released the satoshis, expect your invoice to be paid any time, remember your wallet needs to be online to receive through lighntning network.
      </div>
    </v-list-item-content>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { mapGetters } from 'vuex'
import * as timeago from 'timeago.js'
import { MostroMessage } from '~/store/types'
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
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    ...mapGetters('orders', ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    sellerPubkey() {
      // @ts-ignore
      return this.order?.seller_pubkey
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>