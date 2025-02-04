import { BIP32Factory } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { mnemonicToSeedSync } from 'bip39'

const bip32 = BIP32Factory(ecc)

export class KeyDerivation {
  private static readonly PURPOSE = 44
  private static readonly COIN_TYPE = 1237 // Mostro's coin type
  private static readonly ACCOUNT = 38383 // Mostro's account
  private static readonly CHANGE = 0

  /**
   * Derives a child key from a master private key using BIP32
   * @param masterPrivKey - Master private key in hex format
   * @param tradeIndex - Index for key derivation
   * @returns Derived private key in hex format
   */
  static deriveTradeKey(seed: Uint8Array<ArrayBufferLike>, tradeIndex: number): string {
    const node = bip32.fromSeed(seed)
    
    // Derive using path m/44'/1237'/38383'/0/tradeIndex
    const derived = node
      .deriveHardened(this.PURPOSE)
      .deriveHardened(this.COIN_TYPE)
      .deriveHardened(this.ACCOUNT)
      .derive(this.CHANGE)
      .derive(tradeIndex)

    return Buffer.from(derived.privateKey!).toString('hex')
  }

  /**
   * Derives the identity key from a master private key using BIP32
   * @param seed - Master private key in hex format
   * @returns Derived private key in hex format
   */
  static deriveIdentityKey(seed: Uint8Array<ArrayBufferLike>): string {
    const node = bip32.fromSeed(seed)
    const derived = node
      .deriveHardened(this.PURPOSE)
      .deriveHardened(this.COIN_TYPE)
      .deriveHardened(this.ACCOUNT)
      .derive(this.CHANGE)
      .derive(0)
    return Buffer.from(derived.privateKey!).toString('hex')
  }
}

export async function getFingerprint(mnemonic: string): Promise<Uint8Array<ArrayBufferLike>> {
  const seed = mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed)
  return root.fingerprint
} 
