<template>
  <v-list three-line>
    <template v-for="(peerThread, index) of getPeerThreadSummaries" :key="peerThread.lastMessage.id">
      <v-divider v-if="index !== 0" :key="`divider-${peerThread.lastMessage.id}`"/>
      <v-list-item ripple :to="`/messages/${peerThread.lastMessage.peerNpub}`">
        <div class="mb-2">
          <v-list-item-title>
            <div class="d-flex justify-space-between align-center">
              <PeerAvatar :npub="peerThread.peer" />
              <div class="text-caption text-disabled">
                {{ peerThread.messageCount }}
                <v-icon x-small>mdi-message</v-icon>
              </div>
            </div>
          </v-list-item-title>
          <v-list-item-subtitle>
            <div class="d-flex justify-space-between">
              <div class="mt-3 text-caption text-disabled">{{ peerThread.lastMessage.text }}</div>
              <div>{{ timeago.format(peerThread.lastMessage.created_at * 1e3) }}</div>
            </div>
          </v-list-item-subtitle>
        </div>
      </v-list-item>
    </template>
  </v-list>
</template>
<script setup lang="ts">
import { useMessages } from '~/stores/messages'
import * as _timeago from 'timeago.js'

const messagesStore = useMessages()
const getPeerThreadSummaries = computed(() => messagesStore.getPeerThreadSummaries)

const timeago = ref(_timeago)

</script>

