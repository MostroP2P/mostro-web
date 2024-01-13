<template>
  <code>
    <strong>
      <a @click="() => onPubkeyClick()" class="npub">
        {{ isMobile ? truncateMiddle(npub) : npub }}
      </a>
    </strong>
  </code>
</template>
<script lang="ts">
import { nip19 } from 'nostr-tools'
import textMessage from '~/mixins/text-message'
import mobileDetector from '~/mixins/mobile-detector'
export default {
  mixins: [mobileDetector, textMessage],
  name: 'Npub',
  props: {
    publicKey: {
      type: String,
      required: true
    }
  },
  methods: {
    onPubkeyClick() {
      const router = useRouter()
      router.push({ path: `/messages/${this.npub}` })
    }
  },
  computed: {
    npub() {
      if (!this.publicKey) return '...'
      return nip19.npubEncode(this.publicKey)
    }
  }
}
</script>
<style scoped>
.npub {
  color: #38efd0;
  cursor: pointer;
}
</style>