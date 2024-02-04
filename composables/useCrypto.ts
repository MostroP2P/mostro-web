export function useCrypto() {
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

  return { generateSalt, deriveKey };
}