<template>
  <code>
    <strong>
      <a @click="() => onPubkeyClick()" class="npub">
        {{ userName ? userName : displayNpub }}
      </a>
    </strong>
  </code>
</template>
<script lang="ts">
import { defineComponent, computed, onMounted, ref } from 'vue'
import { nip19 } from 'nostr-tools'
import { useRouter } from 'vue-router'
import useMobileDetector from '~/composables/useMobileDetector'
import useTruncateMiddle from '~/composables/useText'
import type { Nostr } from '~/plugins/01-nostr'

export default defineComponent({
  name: 'Npub',
  props: {
    publicKey: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const { isMobile } = useMobileDetector()
    const { truncateMiddle } = useTruncateMiddle()

    const npub = computed(() => {
      if (!props.publicKey) return '...'
      return nip19.npubEncode(props.publicKey)
    })

    const displayNpub = computed(() => {
      return isMobile.value ? truncateMiddle(npub.value) : npub.value
    })

    function onPubkeyClick() {
      router.push({ path: `/messages/${npub.value}` })
    }

    const userName = ref('')
    const nuxt = useNuxtApp()
    const $nostr: Nostr = nuxt.$nostr as Nostr
    if ($nostr) {
      $nostr.fetchProfile({ pubkey: props.publicKey })
        .then(profile => {
          userName.value = profile?.username || profile?.displayName || ''
        })
    }

    return {
      onPubkeyClick,
      displayNpub,
      userName
    }
  }
})
</script>
<style scoped>
.npub {
  color: #38efd0;
  cursor: pointer;
}
</style>