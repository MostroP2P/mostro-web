import Vue from 'vue'

export default Vue.extend({
  methods: {
    getPublicKey() {
      // @ts-ignore
      window.nostr.getPublicKey()
        .then((res: any) => console.log('res: ', res))
        .catch((err: any) => console.error(`Error while trying to get permission from the NIP07. Err: `, err))
    }
  }
})