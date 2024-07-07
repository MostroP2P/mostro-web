<template>
  <v-card>
    <v-list>
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

const authStore = useAuth()
const { isMobile } = useMobileDetector()
const { hexToNsec } = useNip19()

const isShown = ref<boolean>(false)

const toggleButtonText = computed(() => isShown.value ? 'Hide' : 'Show')

const secret = computed(() => {
  return hexToNsec(authStore.privKey)
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