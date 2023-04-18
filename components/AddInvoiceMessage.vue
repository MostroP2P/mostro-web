<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Needed
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <v-list-item-subtitle>
      <p>
        Get in touch with the seller, user
        <code>
          <strong>
            <a @click="() => onPubkeyClick(sellerId)">
              {{ isMobile ? truncateMiddle(sellerId) : sellerId  }}
            </a>
          </strong>
        </code>      
        so as to get the details on how to send the money you must send {{ fiatAmount }} {{ fiatCode }} through {{ paymentMethod }}.
      </p>
    </v-list-item-subtitle>
    <v-list-item-subtitle class="d-flex justify-space-between">
      Once you send the money, please let me know by pressing the "FIAT SENT" button down below.
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { MostroMessage } from '~/store/types'
import * as timeago from 'timeago.js'
export default Vue.extend({
  data() {
    return {
      timeago
    }
  },
  props: {
    message: {
      type: Object as PropType<MostroMessage>,
      required: true
    }
  },
  computed: {
    sellerId() {
      return this.message.content.SmallOrder?.seller_pubkey
    },
    fiatAmount() {
      return this.message.content.SmallOrder?.fiat_amount
    },
    fiatCode() {
      return this.message.content.SmallOrder?.fiat_code
    },
    paymentMethod() {
      return this.message.content.SmallOrder?.payment_method
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>