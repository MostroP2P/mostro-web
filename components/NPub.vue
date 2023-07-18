<template>
  <code>
    <strong>
      <a @click="() => onPubkeyClick(npub)" class="npub">
        {{ isMobile ? truncateMiddle(npub) : npub }}
      </a>
    </strong>
  </code>
</template>
<script lang="ts">
import textMessage from '~/mixins/text-message'
import mobileDetector from '~/mixins/mobile-detector'
export default {
  mixins: [mobileDetector, textMessage],
  name: 'Npub',
  props: {
    npub: {
      type: String,
      required: true
    }
  },
  methods: {
    onPubkeyClick() {
      const router = useRouter()
      router.push({ path: `/messages/${this.npub}` })
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