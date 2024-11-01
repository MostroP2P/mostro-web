<template>
  <div fluid class="d-flex flex-column" id="chat-root">
    <v-card
      rounded="0"
      class="flex-grow-1"
      id="messages-container"
    >
      <div id="scrollingContent" style="height: calc(100vh - 310px)">
        <v-card-text v-if="peerMessages && peerMessages.length > 0">
          <v-row v-for="(message, index) in peerMessages" :key="message.id" :id="`message-${index}`" class="message-row">
            <v-col cols="12" :class="['d-flex', message.sender === 'me' ? 'justify-end' : '']">
              <div>
                <div
                  class="text-caption mb-0 mx-2 text-disabled"
                  :class="['d-flex', message.sender === 'me' ? 'flex-row-reverse' : '']"
                >
                  {{ getMessageTime(message) }}
                </div>
                <div :class="['message-wrapper', message.sender]">
                  <v-avatar
                    :class="['avatar', message.sender]"
                    size="24"
                    style="border: 0.5px solid white"
                  >
                    <v-img
                      v-if="message.sender === 'me' ? myProfilePictureUrl !== null : peerProfilePictureUrl !== null"
                      :src="message.sender === 'me' ? myProfilePictureUrl || undefined : peerProfilePictureUrl || undefined"
                    />
                    <v-icon dark large v-else>
                      mdi-account-circle
                    </v-icon>
                  </v-avatar>
                  <div
                    :class="['message-chip', 'white--text', 'py-1', 'pr-2', 'pl-1']"
                  >
                    {{ message.text }}
                  </div>
                </div>
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
          :disabled="isSending || !isInputEnabled"
          class="flex-grow-1 mx-4"
        ></v-text-field>
        <v-btn
          class="mb-5 mr-4"
          color="primary"
          @click="sendMessage"
          :disabled="isSending || !isInputEnabled"
          icon="mdi-send"
        >
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '@/stores/auth'
import { useMessages } from '~/stores/messages'
import { useTimeago } from '@/composables/timeago'
import type { PeerMessage } from '~/stores/types'
import type { Nostr } from '~/plugins/01-nostr'
import type { Mostro } from '~/plugins/02-mostro'
import { useProfile } from '@/composables/useProfile'
import useNip19 from '@/composables/useNip19'

const { hexToNpub, npubToHex } = useNip19()

const myProfilePictureUrl = ref<string | null>(null)
const peerProfilePictureUrl = ref<string | null>(null)
const inputMessage = ref('')
const isSending = ref<boolean>(false)

const authStore = useAuth()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const nuxtApp = useNuxtApp()
const $mostro: Mostro = nuxtApp.$mostro as Mostro
const $nostr: Nostr = nuxtApp.$nostr as Nostr

const props = defineProps({
  npub: {
    type: String,
    required: false,
    default: null
  },
  enabled: {
    type: Boolean,
    required: false,
    default: true
  }
})

const isInputEnabled = computed(() => isAuthenticated.value && !!props.npub && props.enabled)

const { getProfile } = useProfile()
getProfile(props.npub)
  .then(profile => peerProfilePictureUrl.value = profile?.image ?? null)

if (authStore.pubKey) {
  getProfile(hexToNpub(authStore.pubKey))
    .then(profile => myProfilePictureUrl.value = profile?.image ?? null)
}

const scrollToBottom = async (id: string) => {
  const msgElement = document.getElementById(id)
  msgElement?.scrollIntoView({ behavior: 'smooth' })
}

const sendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text) return
  isSending.value = true
  try {
    await $mostro.submitDirectMessage(text, npubToHex(props.npub))
    if (authStore.pubKey) {
      await $mostro.submitDirectMessage(text, authStore.pubKey)
    }
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

onMounted(() => {
  const pubkey = npubToHex(props.npub)
  $nostr.subscribeGiftWraps(pubkey)
})

watch(peerMessages, () => {
  if (isSending.value) {
    // We're about to display our message in the chat box, so we better
    // delete the input field
    inputMessage.value = ''
  }
  const lastMessage = peerMessages.value[peerMessages.value.length - 1]
  if (lastMessage) {
    const id = lastMessage.id
    setTimeout(() => scrollToBottom(id), 100)
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
  background: rgb(20, 101, 34);
}

.other {
  background: rgb(92, 98, 93);
}

.message-row {
  display: flex;
  justify-content: flex-start;
}

.message-wrapper {
  display: inline-flex;
  align-items: flex-start;
  border-radius: 16px;
  margin: 4px;
}

.message-wrapper.me {
  justify-content: flex-end;
}

.avatar {
  margin: 4px 4px 0 4px;
}

.avatar.me {
  order: 2;
  margin-left: 8px; /* Space between message and avatar */
}

.avatar.other {
  order: -1;
  margin-right: 8px; /* Space between message and avatar */
}

.message-chip {
  max-width: calc(100% - 40px); /* Adjust based on avatar size and desired padding */
  word-break: break-word;
  display: inline-block;
  margin: 4px;
}
</style>

