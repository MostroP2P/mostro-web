<template>
  <v-card class="mx-auto">
    <v-list lines="three">
      <div
        v-for="(message, index) in orderMessages"
        :key="`${message.id}-${index}`"
      >
        <message :message="message" :disabled="index < orderMessages.length - 1"/>
        <v-divider v-if="index < orderMessages.length - 1"/>
      </div>
    </v-list>
  </v-card>
</template>
<script lang="ts">
import { mapState } from 'pinia'
import { Action, MostroMessage } from '~/stores/types'
import { useMessages } from '@/stores/messages'
export default {
  props: {
    orderId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(useMessages, ['getMostroMessagesByOrderId']),
    orderMessages() {
      // @ts-ignore
      return this.getMostroMessagesByOrderId(this.orderId)
        .filter((msg: MostroMessage) => msg.action !== Action.CantDo)
    }
  }
}
</script>