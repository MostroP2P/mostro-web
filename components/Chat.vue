<template>
  <div fluid class="h-100 d-flex flex-column">
    <v-card
      class="overflow-y-auto"
      max-height="490"
      id="messages-container"
    >
      <v-card-text ref="scrollingContent">
        <v-row v-for="(message, index) in peerMessages" :key="message.id">
          <v-col
            :class="message.sender === 'me' ? 'text-right' : 'text-left'"
            cols="12"
          >
            <div class="text-caption mb-0 mx-2">{{ getMessageTime(message) }}</div>
            <v-chip
              :class="[
                message.sender === 'me' ? 'primary' : 'secondary',
                'white--text',
                'px-4',
                'py-2',
                index === peerMessages.length - 1 ? 'last-peer-message' : ''
              ]"
            >
              {{ message.text }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <div
      ref="inputContainer"
      class="input-container"
      :style="{ height: `${inputContainerHeight}px` }"
    >
      <v-container fluid>
        <v-row>
          <v-col cols="10">
            <v-text-field
              v-model="inputMessage"
              @keydown.enter="sendMessage"
              outlined
              placeholder="Type your message here..."
              single-line
            ></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-btn fab color="primary" @click="sendMessage">
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import * as timeago from 'timeago.js'
import { PeerMessage } from '~/store/types'

export default {
  data() {
    return {
      inputMessage: '',
      inputContainerHeight: 0,
      timeago
    }
  },
  methods: {
    async sendMessage() {
      // @ts-ignore
      const text = this.inputMessage.trim()
      if (!text) return
      // @ts-ignore
      const { npub } = this.$route.params
      // @ts-ignore
      const lastMessage = this.peerMessages[this.peerMessages.length - 1]
      const { id } = lastMessage
      // @ts-ignore
      await this.$mostro.submitDirectMessage(text, npub, id)
      // @ts-ignore
      this.inputMessage = ''
      this.scrollToBottom()
    },
    // @ts-ignore
    getMessageTime(message: PeerMessage) {
      // @ts-ignore
      return this.timeago.format(message.created_at * 1e3)
    },
    scrollToBottom() {
      // @ts-ignore
      this.$nextTick(() => {
        // @ts-ignore
        if (this.$refs?.scrollingContent) {
          // @ts-ignore
          this.$refs.scrollingContent.scrollIntoView(false)
        }
      });
    },
  },
  watch: {
    peerMessages: {
      handler() {
        // @ts-ignore
        this.scrollToBottom();
      },
      // To scroll when the component is mounted, set immediate to true
      immediate: true
    }
  },
  computed: {
    ...mapGetters('messages', ['getPeerMessagesByNpub']),
    peerMessages() {
      // @ts-ignore
      const { npub } = this.$route.params
      // @ts-ignore
      return this.getPeerMessagesByNpub(npub)
    }
  }
}
</script>

<style scoped>
.input-container {
  background-color: white;
  width: 90%;
  position: absolute;
  bottom: 80px;
  z-index: 1;
}
</style>
