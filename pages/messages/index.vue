<template>
  <v-list three-line>
    <template v-for="(peerThread, index) of getPeerThreadSummaries" :key="peerThread.lastMessage.id">
      <v-divider v-if="index !== 0" :key="`divider-${peerThread.lastMessage.id}`"/>
      <v-list-item ripple :to="`/messages/${peerThread.lastMessage.peerNpub}`">
        <div>
          <v-avatar color="secondary">
            <v-icon dark>
              mdi-account-circle
            </v-icon>
          </v-avatar>
        </div>
        <div>
          <v-list-item-title>
            <div class="d-flex justify-space-between">
              <div>{{ title(peerThread.peer) }}</div>
              <div class="text-caption">
                {{ peerThread.messageCount }}
                <v-icon x-small>mdi-message</v-icon>
              </div>
            </div>
          </v-list-item-title>
          <v-list-item-subtitle>
            <div class="d-flex justify-space-between">
              <div>{{ peerThread.lastMessage.text }}</div>
              <div>{{ timeago.format(peerThread.lastMessage.created_at * 1e3) }}</div>
            </div>
          </v-list-item-subtitle>
        </div>
      </v-list-item>
    </template>
  </v-list>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useMessages } from '~/stores/messages'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'
import mobileDetector from '~/mixins/mobile-detector'
export default defineComponent({
  mixins: [ textMessage, mobileDetector ],
  data() {
    return { timeago }
  },
  methods: {
    title(npub: string) {
      return this.isMobile ? this.truncateMiddle(npub) :  npub
    }
  },
  computed: {
    ...mapState(useMessages, ['getPeerThreadSummaries']),
  }
})
</script>