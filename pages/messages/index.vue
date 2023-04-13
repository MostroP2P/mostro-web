<template>
  <v-list three-line>
    <template v-for="(peerThread, index) of getPeerThreadSummaries">
      <v-divider v-if="index !== 0" :key="`divider-${peerThread.lastMessage.id}`"/>
      <v-list-item :key="peerThread.lastMessage.id" ripple :to="`/messages/${peerThread.lastMessage.peerNpub}`">
        <v-list-item-avatar>
          <v-avatar color="secondary">
            <v-icon dark>
              mdi-account-circle
            </v-icon>
          </v-avatar>
        </v-list-item-avatar>
        <v-list-item-content>
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
              <div>{{ timeago.format(peerThread.lastMessage.created_at) }}</div>
            </div>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-list>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import * as timeago from 'timeago.js'
import textMessage from '~/mixins/text-message'
export default Vue.extend({
  mixins: [ textMessage ],
  data() {
    return { timeago }
  },
  methods: {
    title(npub: string) {
      return this.isMobile ? this.truncateMiddle(npub) :  npub
    }

  },
  computed: {
    ...mapGetters('messages', ['getPeerThreadSummaries']),
  }
})
</script>