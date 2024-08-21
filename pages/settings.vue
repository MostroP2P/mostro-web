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
          Secret Key
        </v-list-item-title>
        <v-list-item-subtitle>
          Be mindful of this information
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
    </v-list>
  </v-card>  
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAuth } from '../stores/auth'
import useMobileDetector from '../composables/useMobileDetector'
import useNip19 from '../composables/useNip19'
import { useMostroStore } from '../stores/mostro'
const authStore = useAuth()
const { isMobile } = useMobileDetector()
const { hexToNsec, hexToNpub } = useNip19()

const isShown = ref<boolean>(false)

const toggleButtonText = computed(() => isShown.value ? 'Hide' : 'Show')

const mostroStore = useMostroStore()

const mostroInfo = computed(() => {
  const keys = mostroStore.listMostroKeys()
  // for now we only have a single mostro instance, so we return the first one
  return hexToNpub(keys[0])
})

const secret = computed(() => {
  if (authStore?.privKey) {
    return hexToNsec(authStore.privKey)
  }
  return ''
})

const hasSecret = computed(() => {
  return authStore.privKey !== null
})

const onCopy = () => {
  navigator.clipboard.writeText(secret.value)
}

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