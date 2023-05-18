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
import Vue from 'vue'
import textMessage from '~/mixins/text-message'
import mobileDetector from '~/mixins/mobile-detector'
export default Vue.extend({
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
      this.$router.push(`/messages/${this.npub}`)
    }
  }
})
</script>
<style scoped>
.npub {
  color: #38efd0;
}
</style>