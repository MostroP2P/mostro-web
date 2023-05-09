<template>
  <code>
    <strong>
      <a @click="() => onPubkeyClick(npub)">
        {{ isMobile ? truncateMiddle(npub) : npub }}
      </a>
    </strong>
  </code>
</template>
<script lang="ts">
import Vue from 'vue'
import textMessage from '~/mixins/text-message'
export default Vue.extend({
  mixins: [textMessage],
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