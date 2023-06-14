import Vue from 'vue'

export default Vue.extend({
  methods: {
    generateSalt() {
      const array = Buffer.alloc(16)
      self.crypto.getRandomValues(array)
      return array
    },
    async deriveKey(password: string, salt: string, keyUsages: KeyUsage[]) {
      let enc = new TextEncoder()
      let passwordKey = await self.crypto.subtle.importKey(
        'raw', 
        enc.encode(password), 
        { name: 'PBKDF2' }, 
        false, 
        ['deriveKey', 'deriveBits']
      )
    
      let key = await self.crypto.subtle.deriveKey(
        {
          'name': 'PBKDF2',
          salt: enc.encode(salt), 
          'iterations': 100000,
          'hash': 'SHA-256'
        },
        passwordKey,
        { 'name': 'AES-GCM', 'length': 256},
        true,
        keyUsages
      )
    
      return key
    }
  }
})