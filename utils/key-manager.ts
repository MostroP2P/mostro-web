import { mnemonicToSeedSync } from '@scure/bip39'
import Dexie from 'dexie'
import { getPublicKey } from 'nostr-tools'
import type { KeyProvider } from './nostr/key-provider'
import { KeyDerivation } from './key-derivation'

interface TradeKeyRecord {
  id?: number // Dexie will auto-increment this
  orderId: string | null // Can be null for identity key
  keyIndex: number
  derivedKey: string
  createdAt: number
}

export class TradeKeysDatabase extends Dexie {
  tradeKeys!: Dexie.Table<TradeKeyRecord, number>

  constructor() {
    super('mostro-trade-keys-db')
    this.version(1).stores({
      tradeKeys: '++id, orderId, &keyIndex, derivedKey, createdAt'
    })
  }
}


/**
 * The order ID for unassigned keys
 */
export const UNASSIGNED_ORDER_ID = ''

export class KeyManager implements KeyProvider {
  private db: TradeKeysDatabase
  private initialized: boolean = false
  private identityKey: string | null = null
  private readonly POOL_SIZE = 10 // Total number of unassigned keys to maintain
  private readonly MIN_AVAILABLE = 5 // Minimum number of available keys before replenishing
  seed: Uint8Array | undefined

  constructor() {
    this.db = new TradeKeysDatabase()
  }

  /**
   * Initialize with entropy/mnemonic
   */
  async init(mnemonic: string): Promise<void> {
    if (this.initialized) return

    // Derive master key
    this.seed = mnemonicToSeedSync(mnemonic)

    // Derive identity key
    this.identityKey = KeyDerivation.deriveIdentityKey(this.seed)

    // Initialize key pool
    await this.ensureKeyPool()

    this.initialized = true
  }

  /**
   * Ensures we have enough unassigned keys in the pool
   */
  private async ensureKeyPool(): Promise<void> {
    const unassignedKeys = await this.db.tradeKeys
      .where('orderId')
      .equals(UNASSIGNED_ORDER_ID)
      .count()

    if (unassignedKeys < this.MIN_AVAILABLE) {
      const keysToGenerate = this.POOL_SIZE - unassignedKeys
      const totalTradeKeys =  await this.db.tradeKeys.count();
      let nextIndex = 1
      if (totalTradeKeys > 0) {
        nextIndex = await this.getNextTradeKeyIndex()
      }

      for (let i = 0; i < keysToGenerate; i++) {
        const tradeKey = this.getTradeKey(nextIndex + i)
        await this.storeTradeKey(UNASSIGNED_ORDER_ID, tradeKey, nextIndex + i)
      }
    }
  }

  /**
   * Gets the next available unassigned key
   * @returns The key index and private key
   */
  async getNextAvailableKey(): Promise<{ keyIndex: number, privateKey: string }> {
    // Ensure pool is replenished
    await this.ensureKeyPool()

    const nextUnassigned = await this.db.tradeKeys
      .where('orderId')
      .equals(UNASSIGNED_ORDER_ID)
      .first()

    if (!nextUnassigned) {
      throw new Error('No available keys in pool')
    }

    const privateKey = this.getTradeKey(nextUnassigned.keyIndex)

    return {
      keyIndex: nextUnassigned.keyIndex,
      privateKey
    }
  }

  /**
   * Get the identity key (index 0)
   */
  getIdentityKey(): string | null {
    return this.identityKey
  }

  getTradeKey(keyIndex: number): string {
    if (!this.seed) {
      throw new Error('KeyManager not initialized')
    }
    return KeyDerivation.deriveTradeKey(this.seed, keyIndex)
  }

  /**
   * Get key by order ID
   */
  async getKeyByOrderId(orderId: string): Promise<TradeKeyRecord | undefined> {
    return await this.db.tradeKeys
      .where('orderId')
      .equals(orderId)
      .first()
  }

  /**
   * Gets last unassigned key index from indexedDB and increments it
   */
  private async getNextTradeKeyIndex(): Promise<number> {
    const nextUnassigned = await this.db.tradeKeys
      .where('orderId')
      .equals(UNASSIGNED_ORDER_ID)
      .first()

    if (!nextUnassigned) {
      throw new Error('No available keys in pool')
    }

    return nextUnassigned.keyIndex
  }

  /**
   * Store a new trade key or update existing one with order ID
   */
  async storeTradeKey(orderId: string | null, tradeKey: string, index: number): Promise<number> {
    const tradePubKey = getPublicKey(Buffer.from(tradeKey, 'hex'))

    try {
      // Check if key already exists
      const existing = await this.db.tradeKeys
        .where('keyIndex')
        .equals(index)
        .first()

      if (existing) {
        // Update existing record
        await this.db.tradeKeys
          .where('keyIndex')
          .equals(index)
          .modify({ orderId })
      } else {
        // Add new record
        await this.db.tradeKeys.add({
          orderId,
          keyIndex: index,
          derivedKey: tradePubKey,
          createdAt: Math.floor(Date.now() / 1000)
        })
      }

      return index
    } catch (error) {
      if (error instanceof Dexie.ConstraintError) {
        console.error(`Attempted to store duplicate key index: ${index}`)
        throw new Error(`Key index ${index} already exists`)
      }
      throw error
    }
  }

  async isTradeKey(key: string): Promise<boolean> {
    const keyRecord = await this.db.tradeKeys
      .where('derivedKey')
      .equals(key)
      .first()
    return keyRecord !== undefined
  }

  /**
   * Update an existing key with an order ID
   * This is used when we need to associate a previously generated key with a new order ID
   */
  async updateKeyOrderId(keyIndex: number, orderId: string): Promise<void> {
    await this.db.tradeKeys
      .where('keyIndex')
      .equals(keyIndex)
      .modify({ orderId })
  }

  async getPrivateKeyFor(pubkey: string): Promise<string | undefined> {
    // Check if this is a trade key
    const keyRecord = await this.db.tradeKeys
      .where('derivedKey')
      .equals(pubkey)
      .first()

    if (keyRecord) {
      return this.getTradeKey(keyRecord.keyIndex)
    }

    // If not a trade key, check if it's the identity key
    if (pubkey === getPublicKey(Buffer.from(this.identityKey || '', 'hex'))) {
      return this.identityKey || undefined
    }

    return undefined
  }
} 
