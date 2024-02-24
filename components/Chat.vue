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
              <div class="text-caption mb-1 mx-0 text-disabled">
                {{ getMessageTime(message) }}
              </div>
              <div
                rounded
                :class="[
                  'message-chip',
                  message.sender === 'me' ? 'me' : 'other',
                  'white--text',
                  'px-4',
                  'py-2'
                ]"
              >
                {{ message.text }}
              </div>
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
          :append-inner-icon="isSending ? 'mdi-loading mdi-spin' : ''"
          :disabled="isSending"
          class="flex-grow-1 mx-4"
        ></v-text-field>
        <v-btn
          class="mb-5 mr-4"
          color="primary"
          @click="sendMessage"
          :disabled="!isAuthenticated || isSending"
          icon="mdi-send"
        >
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useAuth } from '@/stores/auth'
import { useMessages } from '~/stores/messages'
import { useTimeago } from '@/composables/timeago'
import type { PeerMessage } from '~/stores/types'
import type { Mostro } from '~/plugins/02-mostro'

const inputMessage = ref('')
const isSending = ref<boolean>(false)

const authStore = useAuth()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const nuxtApp = useNuxtApp()
const $mostro: Mostro = nuxtApp.$mostro as Mostro

const props = defineProps({
  npub: {
    type: String,
    required: true
  }
})

const scrollToBottom = async (id: string) => {
  const msgElement = document.getElementById(id)
  msgElement?.scrollIntoView({ behavior: 'smooth' })
}

const sendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text) return
  isSending.value = true
  try {
    await $mostro.submitDirectMessage(text, props.npub, undefined)
    inputMessage.value = ''
  } catch (err) {
    console.error('Error at sending message: ', err)
  } finally {
    isSending.value = false
  }
}
const { format } = useTimeago()
const getMessageTime = (message: PeerMessage) => format(message.created_at * 1e3)

const messages = useMessages()
const peerMessages = computed(() => messages.getPeerMessagesByNpub(props.npub))

watch(peerMessages, () => {
  if (isSending.value) {
    // We're about to display our message in the chat box, so we better
    // delete the input field
    inputMessage.value = ''
  }
  const lastMessage = peerMessages.value[peerMessages.value.length - 1]
  const id = lastMessage.id
  setTimeout(() => scrollToBottom(id), 100)
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

.message-chip {
  display: inline-block;
  border-radius: 16px;
  margin: 4px;
}
</style>
