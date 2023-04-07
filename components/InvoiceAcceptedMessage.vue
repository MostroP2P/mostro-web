<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Accepted
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        The user
        <code>
            <strong>
              <a @click="(e) => onPubkeyClick(e)">
                {{ isMobile ? truncateMiddle(buyerPubkey) : buyerPubkey  }}
              </a>
            </strong>
        </code>
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
import { Message } from '~/store/messages'
import textMessage from '~/mixins/text-message'
import * as timeago from 'timeago.js'

export default Vue.extend({
  data() {
    return { timeago, isMobile: false }
  },
  mixins: [ textMessage ],
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  methods: {
    onPubkeyClick(e: any) {
      // TODO: send the user to /messages/{npub}
    }
  },
  computed: {
    fiatAmount() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.fiatAmount
      }
      return NaN
    },
    fiatCode() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.fiatCode
      }
      return NaN
    },
    paymentMethod() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.paymentMethod
      }
      return NaN
    },
    buyerPubkey() {
      const invoiceAccepted = this.message.content.InvoiceAccepted
      if (invoiceAccepted) {
        return invoiceAccepted.buyer
      }
      return '?'
    },
    creationDate() {
      return this.message.created_at * 1e3
    }
  }
})
</script>