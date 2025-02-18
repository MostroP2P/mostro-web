export interface KeyProvider {
  /**
   * Get the private key for a given public key
   * @param pubkey - The public key to find the corresponding private key for
   * @returns The private key in hex format, or undefined if not found
   */
  getPrivateKeyFor(pubkey: string): Promise<string | undefined>

  /**
   * Check if a given public key is a trade key
   * @param pubkey - The public key to check
   * @returns True if the key is a trade key, false otherwise
   */
  isTradeKey(pubkey: string): Promise<boolean>


  /**
   * Retrieves a list of all trade public keys
   * @returns A list of all trade public keys
   */
  listTradeKeys(): Promise<string[]>
} 