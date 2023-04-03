<template>
  <v-card class="mx-auto">
    <v-list>
      <message v-for="(message, index) in getMessageByOrderId(this.orderId)"
        :key="`${message.id}-${index}`"
        :message="message"
      />
    </v-list>
  </v-card>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
export default Vue.extend({
  props: {
    orderId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters('messages', ['getMessageByOrderId'])
  }
})
</script>