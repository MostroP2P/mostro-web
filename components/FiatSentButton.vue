<template>
  <v-dialog v-model="showDialog" width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on" text color="accent">
        <v-icon left>mdi-cash</v-icon>
        Fiat Sent
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        Confirm
      </v-card-title>
      <v-card-text>
        I confirm that I've sent {{ fiatAmount }} {{ fiatCode?.toUpperCase() }} to
        <npub :npub="sellerPubkey"/>
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
import Vue from 'vue'
import { mapGetters } from 'vuex'
import textMessage from '~/mixins/text-message'
import NPub from '~/components/NPub.vue'
export default Vue.extend({
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
    ...mapGetters('orders', ['getOrderById']),
    order() {
      // @ts-ignore
      return this.getOrderById(this.$route.params.id)
    },
    fiatAmount() {
      // @ts-ignore
      return this.order?.fiat_amount
    },
    fiatCode() {
      // @ts-ignore
      return this.order?.fiat_code
    },
    sellerPubkey() {
      // @ts-ignore
      return this.order?.seller_pubkey
    },
  }
})
</script>