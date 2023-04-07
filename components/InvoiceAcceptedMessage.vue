<template>
  <v-list-item-content>
    <v-list-item-title class="d-flex justify-space-between">
      Invoice Accepted
      <div class="text-caption text--secondary">{{ timeago.format(creationDate) }}</div>
    </v-list-item-title>
    <div class="wrap-text text-message">
      <p>
        The user <code> <strong class="buyer-key">{{ isMobile ? truncateMiddle(buyerPubkey, 10) : buyerPubkey  }}</strong> </code> has taken your order and wants to buy your sats. Get in touch and tell him/her how to send you {{ fiatAmount }} {{ fiatCode }} through {{ paymentMethod }}.
      </p>
      <p>
         Once you verify you have received the full amount you have to release the sats
      </p>
    </div>
  </v-list-item-content>
</template>

<script lang="ts">
import Vue from 'vue'
import type { PropType } from 'vue'
import { Message } from '~/store/messages'
import * as timeago from 'timeago.js'

export default Vue.extend({
  data() {
    return { timeago, isMobile: false }
  },
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true
    }
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth <= 600;
    },
    truncateMiddle(str: string, maxLength: number) {
      if (str.length <= maxLength) {
        return str;
      }

      const halfLength = Math.floor(maxLength / 2);
      const start = str.slice(0, halfLength);
      const end = str.slice(-halfLength);
      return `${start}...${end}`;
    }
  },
  computed: {
    getMessageText() {
      // @ts-ignore
      const details = `The user ${this.buyerPubkey} has taken your order and wants to buy your sats. Get in touch and tell him/her how to send you ${this.fiatAmount} ${this.fiatCode} through ${this.paymentMethod}.\n\n`
      const finalInstructions = 'Once you verify you have received the full amount you have to release the sats'
      return details + finalInstructions
    },
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
<style scoped>
.text-message {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.2;
}
.wrap-text {
  white-space: normal;
  word-wrap: break-word;
}
@media (max-width: 600px) {
  .buyer-key {
    display: inline-block;
    max-width: 50vw; /* Adjust this value based on how much space you want for the public key */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>