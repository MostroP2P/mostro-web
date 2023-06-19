import Vue from 'vue'

export default Vue.extend({
  methods: {
    getPublicKey() {
      // @ts-ignore
      return window.nostr.getPublicKey()
    }
  }
})