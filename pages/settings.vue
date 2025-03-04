<template>
  <v-card>
    <v-list>
      <v-list-item class="mb-4">
        <template v-slot:prepend>
          <v-icon icon="mdi-information-outline"></v-icon>
        </template>
        <v-list-item-title>
          Mostro Info
        </v-list-item-title>
        <v-list-item-subtitle>
          Public key of this mostro operator
        </v-list-item-subtitle>
        <v-row>
          <v-col cols="12" class="font-weight-bold">
            {{ mostroInfo }}
          </v-col>
        </v-row>
      </v-list-item>
      <v-divider />
      <v-list-item v-if="hasSecret">
        <template v-slot:prepend>
          <v-icon icon="mdi-key"></v-icon>
        </template>
        <v-list-item-title>
          Mnemonic
        </v-list-item-title>
        <v-list-item-subtitle>
          Be mindful of this information, this is the key to all your trade identities.
        </v-list-item-subtitle>
        <v-row v-if="!isMobile">
          <v-col cols="1">
            <v-btn
              variant="tonal"
              color="red"
              @click="isShown = !isShown"
              class="mt-4"
            >
              {{ toggleButtonText }}
            </v-btn>
          </v-col>
          <v-col class="centered-text d-flex justify-end">
            <div :class="isShown ? '' : 'blurred'" >
              {{ secret }}
            </div>
            <v-btn
              variant="text"
              icon="mdi-content-copy"
              class="ml-4"
              @click="onCopy"
            />
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col>
            <div class="d-flex justify-space-between align-center">
              <v-btn
                variant="tonal"
                color="red"
                @click="isShown = !isShown"
                class="my-4"
              >
                {{ toggleButtonText }}
              </v-btn>
              <v-btn
                variant="text"
                icon="mdi-content-copy"
                class="ml-4"
                @click="onCopy"
              />
            </div>
            <div :class="isShown ? '' : 'blurred'" >
              {{ secret }}
            </div>
          </v-col>
        </v-row>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <template v-slot:prepend>
          <v-icon icon="mdi-power-plug-outline"></v-icon>
        </template>
        <v-list-item-title>
          Nostr Wallet Connect
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ hasNwc ? 'NWC is configured' : 'NWC is not configured' }}
        </v-list-item-subtitle>
        <v-row>
          <v-col>
            <NwcDialog v-if="!hasNwc" class="mt-4"/>
            <v-btn
              v-else
              variant="tonal"
              color="error"
              class="mt-4"
              @click="authStore.deleteNwc()"
            >
              Remove NWC
            </v-btn>
          </v-col>
        </v-row>
      </v-list-item>
    </v-list>
  </v-card>  
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAuth } from '../stores/auth'
import useMobileDetector from '../composables/useMobileDetector'
import useNip19 from '../composables/useNip19'
import { useMostroStore } from '../stores/mostro'
import NwcDialog from '~/components/NwcDialog.vue'

const authStore = useAuth()
const { isMobile } = useMobileDetector()
const { hexToNsec, hexToNpub } = useNip19()

const isShown = ref<boolean>(false)

const toggleButtonText = computed(() => isShown.value ? 'Hide' : 'Show')

const mostroStore = useMostroStore()

const mostroInfo = computed(() => {
  const defaultMostroKey = mostroStore.getDefaultMostroPubkey();
  if (!defaultMostroKey)  return '';

  return hexToNpub(defaultMostroKey);
})

const secret = computed(() => {
  return authStore?.mnemonic || '';
})

const hasSecret = computed(() => {
  return !!authStore.mnemonic;
})

const onCopy = () => {
  navigator.clipboard.writeText(secret.value)
}

const hasNwc = computed(() => authStore.hasNwc)

</script>

<style scoped>
.secret {
  font-size: 14px;
}
.hidden {
  letter-spacing: 1px;
}
.centered-text {
  display: flex;
  align-items: center;
  justify-content: center;
}
.blurred {
  filter: blur(8px);
}
</style>
