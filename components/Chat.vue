<template>
  <div fluid class="d-flex flex-column" id="chat-root">
    <v-card
      rounded="0"
      class="flex-grow-1"
      id="messages-container"
    >
      <div id="scrollingContent" style="height: calc(100vh - 350px)">
        <v-card-text v-if="peerMessages && peerMessages.length > 0">
          <v-row v-for="(message) in peerMessages" :key="message.id" :id="message.id">
            <v-col
              :class="message.sender === 'me' ? 'text-right' : 'text-left'"
              cols="12"
            >
              <div class="text-caption mb-1 mx-0 text-disabled">{{ getMessageTime(message) }}</div>
              <v-chip
                rounded
                :class="[
                  message.sender === 'me' ? 'me' : 'other',
                  'white--text',
                  'px-4',
                  'py-2'
                ]"
              >
                {{ message.text }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card-text>
      </div>
    </v-card>
    <v-card
      rounded="0"
      ref="inputContainer"
    >
      <div class="d-flex justify-center align-center">
        <v-text-field
          v-model="inputMessage"
          @keydown.enter="sendMessage"
          variant="outlined"
          placeholder="Type your message here..."
          single-line
          class="flex-grow-1 mx-4"
        ></v-text-field>
        <v-btn
          class="mb-5 mr-4"
          color="primary"
          @click="sendMessage"
          :disabled="!isAuthenticated"
          icon="mdi-send"
        >
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { mapState } from 'pinia'
import { useAuth } from '@/stores/auth'
import { useMessages } from '~/stores/messages'
import * as _timeago from 'timeago.js'
import type { PeerMessage } from '~/stores/types'

export default defineComponent({
  setup() {
    const inputMessage = ref('')
    const inputContainerHeight = ref(0)
    const timeago = ref(_timeago)

    const scrollToBottom = async (id: string) => {
      const msgElement = document.getElementById(id)
      msgElement?.scrollIntoView({ behavior: 'smooth' })
    }

    const authStore = useAuth()
    const isAuthenticated = computed(() => authStore.isAuthenticated)

    return { inputMessage, inputContainerHeight, timeago, scrollToBottom, isAuthenticated }
  },
  props: {
    npub: {
      type: String,
      required: true
    }
  },
  methods: {
    async sendMessage() {
      // @ts-ignore
      const text = this.inputMessage.trim()
      if (!text) return
      // @ts-ignore
      const lastMessage = this.peerMessages[this.peerMessages.length - 1]
      const id = lastMessage?.id || null
      // @ts-ignore
      await this.$mostro.submitDirectMessage(text, this.npub, id)
      // @ts-ignore
      this.inputMessage = ''
    },
    // @ts-ignore
    getMessageTime(message: PeerMessage) {
      // @ts-ignore
      return this.timeago.format(message.created_at * 1e3)
    },
  },
  watch: {
    peerMessages: {
      handler(msgs) {
        const lastMessage = msgs[msgs.length - 1]
        const id = lastMessage.id
        setTimeout(() => this.scrollToBottom(id), 100)
      },
      // To scroll when the component is mounted, set immediate to true
      immediate: true
    }
  },
  computed: {
    ...mapState(useMessages, ['getPeerMessagesByNpub']),
    peerMessages() : PeerMessage[] {
      return this.getPeerMessagesByNpub(this.npub)
    }
  }
})
</script>

<style scoped>
#chat-root {
  position: relative;
  height: 100%;
}

#messages-container {
  overflow-y: auto;
  padding-bottom: 64px;
}

.input-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}

.me {
  background: rgb(19, 166, 43);
}

.other {
  background: rgb(92, 98, 93);
}
</style>
