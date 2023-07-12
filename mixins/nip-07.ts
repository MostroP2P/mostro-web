import Vue from 'vue'

export default {
  methods: {
    getPublicKey() {
      // @ts-ignore
      return window.nostr.getPublicKey()
    }
  }
}