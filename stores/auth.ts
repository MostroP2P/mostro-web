import { ref, watch } from 'vue';
import { getPublicKey } from 'nostr-tools';
import { argon2id } from 'argon2-browser';

// Key storage constants
const AUTH_SESSION_STORAGE_ENCRYPTED_KEY = 'auth_encrypted_key';
const AUTH_SESSION_STORAGE_EXPIRY = 'auth_key_expiry';

// Utility: Derive AES-GCM encryption key from Argon2
async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16)); // Random salt

  // Derive key using Argon2id
  const hash = await argon2id({
    pass: passphrase,
    salt: salt,
    time: 3, // Number of iterations
    mem: 65536, // Memory usage in KiB (64 MB)
    parallelism: 1,
    hashLen: 32,
  });

  return crypto.subtle.importKey(
    'raw',
    hash.hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Utility: Encrypt data using AES-GCM
async function encryptData(data: string, passphrase: string): Promise<string> {
  const key = await deriveKeyFromPassphrase(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Random IV
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );

  return JSON.stringify({
    iv: Array.from(iv),
    encrypted: Array.from(new Uint8Array(encrypted)),
  });
}

// Utility: Decrypt data using AES-GCM
async function decryptData(encryptedData: string, passphrase: string): Promise<string> {
  const { iv, encrypted } = JSON.parse(encryptedData);
  const key = await deriveKeyFromPassphrase(passphrase);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encrypted)
  );

  return new TextDecoder().decode(decrypted);
}

// Vue Store for Auth
export const useAuth = defineStore('auth', {
  state: () => ({
    pubKey: null as string | null,
    privKey: null as string | null, // Decrypted private key only in memory
    encryptedKey: sessionStorage.getItem(AUTH_SESSION_STORAGE_ENCRYPTED_KEY),
    expiry: sessionStorage.getItem(AUTH_SESSION_STORAGE_EXPIRY),
  }),

  actions: {
    async login(privateKey: string, passphrase: string) {
      // Encrypt the private key with Argon2 and AES-GCM
      this.encryptedKey = await encryptData(privateKey, passphrase);
      this.expiry = (Date.now() + 30 * 60 * 1000).toString(); // TTL = 30 minutes

      sessionStorage.setItem(AUTH_SESSION_STORAGE_ENCRYPTED_KEY, this.encryptedKey);
      sessionStorage.setItem(AUTH_SESSION_STORAGE_EXPIRY, this.expiry);

      // Decrypted key only exists in memory
      this.privKey = privateKey;
      this.pubKey = getPublicKey(Buffer.from(privateKey, 'hex'));
    },

    async loadFromStorage(passphrase: string) {
      if (!this.encryptedKey || !this.expiry) return;

      if (Date.now() > parseInt(this.expiry)) {
        this.logout();
        console.warn('Stored key has expired.');
        return;
      }

      try {
        // Decrypt the key and load into memory
        const decryptedKey = await decryptData(this.encryptedKey, passphrase);
        this.privKey = decryptedKey;
        this.pubKey = getPublicKey(Buffer.from(decryptedKey, 'hex'));
      } catch (err) {
        console.error('Failed to decrypt key:', err);
        this.logout();
      }
    },

    logout() {
      this.privKey = null;
      this.pubKey = null;
      this.encryptedKey = null;

      sessionStorage.removeItem(AUTH_SESSION_STORAGE_ENCRYPTED_KEY);
      sessionStorage.removeItem(AUTH_SESSION_STORAGE_EXPIRY);
    },
  },

  getters: {
    isAuthenticated(state) {
      return !!state.privKey && !!state.pubKey;
    },
  },
});
