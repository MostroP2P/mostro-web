<template>
  <div class="d-flex pa-2" style="background-color: rgba(45, 45, 45, 0.7); border-radius: 8px;">
    <v-avatar color="primary" size="default" style="border: 1.2px solid rgba(38, 82, 49, 0.3);" variant="elevated">
      <v-img :src="profilePic" v-if="hasProfilepic"/>
      <v-icon dark large v-else>
        mdi-account-circle
      </v-icon>
    </v-avatar>
    <div>
      <div class="ml-3">{{ userName }}</div>
      <div class="text-caption ml-3">{{ npub }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useText from '~/composables/useText'
import useMobileDetector from '~/composables/useMobileDetector'
import type { Nostr } from '~/plugins/01-nostr'

const props = defineProps({
  npub: String
})

const profilePic = ref<string | undefined>(undefined)
const userName = ref<string | undefined>(undefined)
const hasProfilepic = computed<boolean>(() => profilePic.value !== undefined)

if (props.npub) {
  const nuxt = useNuxtApp()
  const $nostr: Nostr = nuxt.$nostr as Nostr
  if ($nostr) {
    $nostr.fetchProfile({ npub: props.npub }).then(profile => {
      if (profile) {
        const { image, username } = profile
        if (image) {
          profilePic.value = image
        }
        if (userName) {
          userName.value = username
        }
      }
    })
  }
}

const { truncateMiddle } = useText()
const { isMobile } = useMobileDetector()

const npub = computed(() => {
  return isMobile.value ? truncateMiddle(props.npub ? props.npub : '') : props.npub
})

</script>

