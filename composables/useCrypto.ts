export function useCrypto() {

  /**
   * Generates a random password
   * @returns A random password
   */
  function generatePassword(length = 26, includeSpecial = true) {
    const charset = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789${
      includeSpecial ? '!@#$%^&*()_+-=[]{};:,.<>?' : ''
    }`
    const values = new Uint32Array(length)
    window.crypto.getRandomValues(values)

    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length]
    }
    return password
  }

  /**
   * Generates a random salt to be used with PBKDF2 
   * @returns A random salt
   */
  function generateSalt() {
    const array = Buffer.alloc(16);
    window.crypto.getRandomValues(array);
    return array;
  }

  /**
   * Derive a key from a password and a salt, this uses
   * <a href="https://en.wikipedia.org/wiki/PBKDF2">PBKDF2</a> to derive a
   * cryptographically stronger encryption key from a user-prodivided password
   * and a salt.
   * 
   * @param password - The password to derive the key from
   * @param salt - The salt to use
   * @param keyUsages The key usages
   * @returns The derived key
   */
  async function deriveKey(password: string, salt: string, keyUsages: KeyUsage[]) {
    let enc = new TextEncoder();
    let passwordKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey', 'deriveBits']
    );

    let key = await window.crypto.subtle.deriveKey(
      {
        'name': 'PBKDF2',
        salt: enc.encode(salt),
        'iterations': 100000,
        'hash': 'SHA-256'
      },
      passwordKey,
      { 'name': 'AES-GCM', 'length': 256 },
      true,
      keyUsages
    );

    return key;
  }

  async function encrypt(data: string, password: string) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const key = await deriveKey(password, Buffer.from(salt).toString('base64'), ['encrypt'])
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    )

    return {
      ciphertext: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      salt: Buffer.from(salt).toString('base64')
    }
  }

  async function decrypt(encrypted: { ciphertext: string, iv: string, salt: string }, password: string) {
    const key = await deriveKey(password, encrypted.salt, ['decrypt'])

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Buffer.from(encrypted.iv, 'base64') },
      key,
      Buffer.from(encrypted.ciphertext, 'base64')
    )

    return new TextDecoder().decode(decrypted)
  }

  return {
    generatePassword,
    generateSalt,
    deriveKey,
    encrypt,
    decrypt
  }
}