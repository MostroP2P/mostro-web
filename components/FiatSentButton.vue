<template>
  <v-dialog v-model="showDialog" width="600">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text prepend-icon="mdi-cash" class="mx-2" min-width="160">
        Fiat Sent
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        Confirm
      </v-card-title>
      <v-card-text>
        I confirm that I've sent {{ fiatAmount }} {{ fiatCode?.toUpperCase() }} to
        <npub :publicKey="sellerPubkey"/>
        .
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="warning" @click="showDialog = false">
          Cancel
        </v-btn>
        <v-btn text color="accent" @click="onConfirm">
          Confirm
        </v-btn>
      </v-card-actions>
      <v-progress-linear v-if="isLoading" indeterminate/>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { useOrders } from '~/stores/orders'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
export default {
  data() {
    return {
      showDialog: false,
      isLoading: false
    }
  },
  components: {
    npub: NPub
  },
  mixins: [ textMessage ],
  methods: {
    async onConfirm() {
      this.isLoading = true
      try {
        // @ts-ignore
        await this.$mostro.fiatSent(this.order)
        this.showDialog = false
      } catch(err) {

      } finally {
        this.isLoading = false
      }
    },
    onPubkeyClick(sellerPubkey: string) {
      this.$router.push(`/messages/${sellerPubkey}`)
    }
  },
  computed: {
    ...mapState(useOrders, ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    fiatAmount() {
      return this.order?.fiat_amount
    },
    fiatCode() {
      return this.order?.fiat_code
    },
    sellerPubkey() {
      return this.order?.master_seller_pubkey
    },
  }
}
</script>