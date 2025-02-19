<template>
  <code>
    <strong>
      <a @click="() => onPubkeyClick()" class="npub">
        {{ displayNpub }}
      </a>
    </strong>
  </code>
</template>
<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { nip19 } from 'nostr-tools'
import { useRouter } from 'vue-router'
import useMobileDetector from '~/composables/useMobileDetector'
import useTruncateMiddle from '~/composables/useText'

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

    return {
      onPubkeyClick,
      displayNpub
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