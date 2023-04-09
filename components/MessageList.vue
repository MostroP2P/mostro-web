<template>
  <v-card class="mx-auto">
    <v-list>
      <div
        v-for="(message, index) in orderMessages"
        :key="`${message.id}-${index}`"
      >
        <message :message="message"/>
        <v-divider v-if="index < orderMessages.length - 1"/>
      </div>
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
    ...mapGetters('messages', ['getMostroMessagesByOrderId']),
    orderMessages() {
      // @ts-ignore
      return this.getMostroMessagesByOrderId(this.orderId)
    }
  }
})
</script>