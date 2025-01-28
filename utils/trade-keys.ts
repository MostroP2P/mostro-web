import Dexie from 'dexie'

interface TradeKeyRecord {
  id?: number // Dexie will auto-increment this
  orderId: string | null // Can be null for identity key
  keyIndex: number
  derivedKey: string
  createdAt: number
}

class TradeKeysDatabase extends Dexie {
  tradeKeys!: Dexie.Table<TradeKeyRecord, number>

  constructor() {
    super('mostro-trade-keys-db')
    this.version(1).stores({
      tradeKeys: '++id, orderId, keyIndex, derivedKey, createdAt'
    })
  }
}

export class TradeKeyManager {
  private db: TradeKeysDatabase
  private lastKeyIndex: number = 0
  private initialized: boolean = false

  constructor() {
    this.db = new TradeKeysDatabase()
  }

  /**
   * Initialize the manager by loading the last used key index
   */
  async init(): Promise<void> {
    if (this.initialized) return

    const lastRecord = await this.db.tradeKeys
      .orderBy('keyIndex')
      .last()
    
    if (lastRecord) {
      this.lastKeyIndex = lastRecord.keyIndex
    }

    this.initialized = true
  }

  /**
   * Get the identity key (index 0)
   */
  async getIdentityKey(): Promise<TradeKeyRecord | undefined> {
    return await this.db.tradeKeys
      .where('keyIndex')
      .equals(0)
      .first()
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
   * Store a new trade key
   * @param orderId - Order ID (null for identity key)
   * @param derivedKey - The derived private key
   * @returns The index used for this key
   */
  async storeTradeKey(orderId: string | null, derivedKey: string): Promise<number> {
    const newIndex = orderId === null ? 0 : this.lastKeyIndex + 1
    await this.db.tradeKeys.add({
      orderId,
      keyIndex: newIndex,
      derivedKey,
      createdAt: Math.floor(Date.now() / 1000)
    })
    if (orderId !== null) {
      this.lastKeyIndex = newIndex
    }
    return newIndex
  }

  async isTradeKey(key: string): Promise<boolean> {
    const keyRecord = await this.db.tradeKeys
      .where('derivedKey')
      .equals(key)
      .first()
    return keyRecord !== undefined
  }

  /**
   * Get the next key index to be used
   */
  get nextKeyIndex(): number {
    return this.lastKeyIndex + 1
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
} 