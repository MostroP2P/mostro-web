import { EventEmitter } from 'tseep'
import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { Nostr } from '../nostr/index'
import { Action, type NewOrder, Order, OrderStatus, OrderType, type MostroInfo, type MostroMessage } from './types'
import type { GiftWrap, Rumor, Seal } from '../nostr/types'
import type { IMostro, MostroEvents } from './mostro-interface'
import { KeyDerivation } from '../key-derivation'
import { KeyManager } from '../key-manager'

const REQUEST_TIMEOUT = 30000 // 30 seconds timeout

interface PendingRequest {
  resolve: (value: MostroMessage) => void
  reject: (reason: any) => void
  timer: NodeJS.Timeout
}

export interface MostroOptions {
  mostroPubKey: string,
  relays: string,
  debug?: boolean
}

export enum PublicKeyType {
  HEX = 'hex',
  NPUB = 'npub'
}

export enum SigningMode {
  INITIAL = 'initial', // Initial signing mode, uses the identity key at the seal level and provides a signature with the trade key in the rumor
  TRADE = 'trade'     // Trade signing mode, uses the trade key at the seal level
}

export class Mostro extends EventEmitter<MostroEvents> implements IMostro {
  mostro: string
  nostr: Nostr
  private debug: boolean
  private keyManager: KeyManager

  private readyResolve!: () => void
  private readyPromise: Promise<void>

  private pendingRequests: Map<number, PendingRequest> = new Map()
  private nextRequestId: number = 1

  constructor(opts: MostroOptions) {
    super()
    this.mostro = opts.mostroPubKey
    this.debug = opts.debug || false
    this.keyManager = new KeyManager()

    this.nostr = new Nostr({ 
      relays: opts.relays, 
      mostroPubKey: opts.mostroPubKey,
      debug: this.debug 
    })

    // Update event listener names and handler
    this.nostr.on('public-message', this.handlePublicMessage.bind(this))
    this.nostr.on('private-message', this.handlePrivateMessage.bind(this))

    this.readyPromise = new Promise(resolve => this.readyResolve = resolve)

    // Wait for Nostr to be ready
    this.nostr.on('ready', this.onNostrReady.bind(this))
  }

  async connect() {
    await this.nostr.connect()
    return this.readyPromise
  }

  async updateMnemonic(mnemonic: string) {
    // Initialize trade key manager if not already done
    await this.keyManager.init(mnemonic)

    // Check if we have an identity key, if not create it
    const identityKey = this.keyManager.getIdentityKey()
    if (!identityKey) {
      throw new Error('No identity key found')
    }
    this.nostr.setIdentitySigner(identityKey)
  }

  async waitForAction(action: Action, orderId: string, timeout: number = 60000): Promise<MostroMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener('mostro-message', handler);
        reject(new Error(`Timeout waiting for action ${action} for order ${orderId}`));
      }, timeout);

      const handler = (mostroMessage: MostroMessage, ev: NDKEvent) => {
        if (mostroMessage.order && 
            mostroMessage.order.action === action && 
            mostroMessage.order.id === orderId) {
          clearTimeout(timer)
          resolve(mostroMessage)
        } else {
          console.warn(`Received unexpected action "${mostroMessage.order?.action}" for order "${mostroMessage.order?.id}", was expecting "${action}"`)
          console.warn('MostroMessage: ', mostroMessage, ', ev: ', ev)
        }
        this.removeListener('mostro-message', handler)
      };

      this.on('mostro-message', handler);
    });
  }

  private getNextRequestId(): number {
    return this.nextRequestId++
  }

  private createPendingRequest(): [number, Promise<MostroMessage>] {
    const requestId = this.getNextRequestId()
    let resolver: ((value: MostroMessage) => void) | undefined
    let rejecter: ((reason: any) => void) | undefined

    const promise = new Promise<MostroMessage>((resolve, reject) => {
      resolver = resolve
      rejecter = reject
    })

    const timer = setTimeout(() => {
      this.pendingRequests.delete(requestId)
      rejecter!(new Error('Request timed out'))
    }, REQUEST_TIMEOUT)

    this.pendingRequests.set(requestId, {
      resolve: resolver!,
      reject: rejecter!,
      timer
    })

    return [requestId, promise]
  }

  onNostrReady() {
    this.debug && console.log('Mostro. Nostr is ready')
    // Subscribe to orders
    this.nostr.subscribeOrders()

    // Add Mostro user
    this.nostr.addUser(new NDKUser({ npub: this.mostro }))

    // Emit ready event
    this.emit('ready')

    // Resolve ready promise
    this.readyResolve()
  }

  extractOrderFromEvent(ev: NDKEvent): Order {
    let id: string | undefined
    let kind: OrderType | null = null
    let status: OrderStatus | null = null
    let fiat_code: string | undefined = undefined
    let fiat_amount = 0
    let min_amount: number | null = null
    let max_amount: number | null = null
    let payment_method = ''
    let premium: number | undefined = undefined
    let amount = 0
    ev.tags.forEach((tag: string[]) => {
      switch(tag[0]) {
        case 'd':
          id = tag[1] as string
          break
        case 'k':
          kind = tag[1] as OrderType
          break
        case 'f':
          fiat_code = tag[1] as string
          break
        case 's':
          status = tag[1] as OrderStatus
          break
        case 'amt':
          amount = Number(tag[1])
          break
        case 'fa':
          fiat_amount = Number(tag[1])
          min_amount = tag[2] ? Number(tag[1]) : null
          max_amount = tag[2] ? Number(tag[2]) : null
          break
        case 'pm':
          payment_method = tag[1] as string
          break
        case 'premium':
          premium = Number(tag[1])
          break
      }
    })

    if (!id || !kind || !status || !payment_method || premium === undefined || !fiat_code) {
      console.error('Missing required tags in event to extract order. ev.tags: ', ev.tags)
      throw Error('Missing required tags in event to extract order')
    }

    const created_at = ev.created_at || 0
    const mostro_id = ev.author.pubkey

    return new Order(
      id,
      kind,
      status,
      fiat_code,
      min_amount,
      max_amount,
      fiat_amount,
      payment_method,
      premium,
      created_at,
      amount,
      mostro_id
    )
  }

  extractInfoFromEvent(ev: NDKEvent): MostroInfo {
    const tags = new Map<string, string>(ev.tags as [string, string][])
    const mostro_pubkey = tags.get('mostro_pubkey') as string
    const mostro_version = tags.get('mostro_version') as string
    const mostro_commit_id = tags.get('mostro_commit_id') as string
    const max_order_amount = Number(tags.get('max_order_amount') as string)
    const min_order_amount = Number(tags.get('min_order_amount') as string)
    const expiration_hours = Number(tags.get('expiration_hours') as string)
    const expiration_seconds = Number(tags.get('expiration_seconds') as string)
    const fee = Number(tags.get('fee') as string)
    const hold_invoice_expiration_window = Number(tags.get('hold_invoice_expiration_window') as string)
    const invoice_expiration_window = Number(tags.get('invoice_expiration_window') as string)
    return {
      mostro_pubkey,
      mostro_version,
      mostro_commit_id,
      max_order_amount,
      min_order_amount,
      expiration_hours,
      expiration_seconds,
      fee,
      hold_invoice_expiration_window,
      invoice_expiration_window
    }
  }

  async handlePublicMessage(ev: NDKEvent) {
    const nEvent = await ev.toNostrEvent()
    // Create a map from the tags array for easy access
    const tags = new Map<string, string | number[]>(ev.tags as [string, string | number[]][])

    const z = tags.get('z')
    if (z === 'order') {
      // Order
      const order = this.extractOrderFromEvent(ev);
      console.info('< [🧌 -> 📢]', JSON.stringify(order), ', ev: ', nEvent)
      this.emit('order-update', order, ev)
    } else if (z === 'info') {
      // Info
      const info = this.extractInfoFromEvent(ev)
      // this.mostroStore.addMostroInfo(info)
      this.emit('info-update', info)
      // console.info('< [🧌 -> 📢]', JSON.stringify(info), ', ev: ', nEvent)
    } else if (z === 'dispute') {
      console.info('< [🧌 -> 📢]', 'dispute', ', ev: ', nEvent)
      // const dispute = this.extractDisputeFromEvent(ev)
      // this.orderStore.addDispute({ dispute: dispute, event: ev as MostroEvent })
    } else {
      // TODO: Extract other kinds of events data: Disputes & Ratings
    }
  }

  isJsonObject(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  /**
   * Handle private messages from any peer
   * @param message - The message content
   * @param ev - The Nostr event
   */
  async handlePrivateMessage(gift: GiftWrap, seal: Seal, rumor: Rumor) {
    if (rumor.pubkey !== seal.pubkey) {
      this.debug && console.warn('🚨 Mismatch between rumor and seal pubkeys: ', rumor.pubkey, ' != ', seal.pubkey)
      return
    }
    const date = (new Date(rumor.created_at as number * 1E3)).getTime()
    const now = new Date().getTime()
    const delta = now - date // Calculates the time delta in milliseconds
    // Check if this is a message from Mostro
    if (rumor.pubkey === this.getMostroPublicKey(PublicKeyType.HEX)) {
      const message = rumor.content
      const mostroMessage = JSON.parse(message) as MostroMessage
      mostroMessage.created_at = rumor.created_at // Sets the created_at timestamp to the event timestamp
      this.debug && console.info(`[🎁][🧌 -> me] [d: ${delta}]: `, mostroMessage, ', ev: ', rumor)
      this.emit('mostro-message', mostroMessage, rumor as NDKEvent)

      // Check if this message is a response to a pending request
      const requestId = mostroMessage.order?.request_id || mostroMessage['cant-do']?.request_id
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timer } = this.pendingRequests.get(requestId)!
        clearTimeout(timer)
        this.pendingRequests.delete(requestId)
        resolve(mostroMessage)
      }
    } else {
      // Handle messages from other peers, emitting event to be handled
      // by the responsible component
      console.info(`[🎁][🍐 -> me] [d: ${delta}]: `, rumor.content, rumor)
      this.emit('peer-message', gift, seal, rumor)
    }
  }

  private async sendMostroRequest(action: Action, payload: any): Promise<MostroMessage> {
    const [requestId, promise] = this.createPendingRequest()
    const fullPayload: { order: any } | [order: any, string] = {
      order: {
        version: 1,
        request_id: requestId,
        action,
        ...payload
      }
    }

    try {
      // For initial order actions, don't use a trade key
      if (action === Action.TakeBuy || action === Action.TakeSell || action === Action.NewOrder) {
        this.nostr.setSigningMode(SigningMode.INITIAL)
      } else {
        this.nostr.setSigningMode(SigningMode.TRADE)
        // For all other actions, get and use the trade key for this order
        const orderId = payload.id
        if (!orderId) {
          throw new Error('Order ID is required for trade actions')
        }
        const tradeKey = await this.keyManager.getKeyByOrderId(orderId)
        if (!tradeKey) {
          throw new Error(`No trade key found for order ${orderId}`)
        }
        this.nostr.setTradeSigner(tradeKey.derivedKey)
      }

      await this.nostr.createAndPublishMostroEvent(fullPayload, this.getMostroPublicKey(PublicKeyType.HEX))
      return promise
    } finally {
      // Always clear the trade signer after use
      this.nostr.setTradeSigner('')
    }
  }

  async submitOrder(order: NewOrder) {
    // Generate a new key for this order
    const newKeyIndex = this.keyManager.nextKeyIndex
    const tradeKey = this.keyManager.getTradeKey(newKeyIndex)
    
    // Set the trade signer for this order
    this.nostr.setTradeSigner(tradeKey)

    try {
      const response = await this.sendMostroRequest(Action.NewOrder, {
        content: { order }
      })

      // If the order was successful, update the trade key with the order ID
      if (response.order?.payload?.order?.id) {
        const orderId = response.order.payload.order.id
        // Store the key (orderId will be set after we get the response)
        await this.keyManager.storeTradeKey(orderId, tradeKey)
      }

      return response
    } finally {
      // Clear the trade signer after the order is submitted
      this.nostr.setTradeSigner('')
    }
  }

  async takeSell(order: Order, amount?: number | undefined) {
    return this.sendMostroRequest(Action.TakeSell, {
      id: order.id,
      content: amount ? { amount } : null
    })
  }

  async takeBuy(order: Order, amount?: number | undefined) {
    return this.sendMostroRequest(Action.TakeBuy, {
      id: order.id,
      content: amount ? { amount } : null
    })  }

  async addInvoice(order: Order, invoice: string, amount: number | null = null) {
    return this.sendMostroRequest(Action.AddInvoice, {
      id: order.id,
      content: {
        payment_request: [null, invoice, amount]
      }
    })
  }

  async release(order: Order) {
    return this.sendMostroRequest(Action.Release, {
      id: order.id,
      content: null
    })
  }

  async fiatSent(order: Order) {
    return this.sendMostroRequest(Action.FiatSent, {
      id: order.id
    })
  }

  async rateUser(order: Order, rating: number) {
    return this.sendMostroRequest(Action.RateUser, {
      id: order.id,
      content: { rating_user: rating }
    })
  }

  async dispute(order: Order) {
    return this.sendMostroRequest(Action.Dispute, {
      id: order.id,
      content: null
    })
  }

  async cancel(order: Order) {
    return this.sendMostroRequest(Action.Cancel, {
      id: order.id,
      content: null
    })
  }

  async submitDirectMessageToPeer(message: string, destination: string, tags: string[][]): Promise<void> {
    await this.nostr.sendDirectMessageToPeer(message, destination, tags)
  }

  getMostroPublicKey(type?: PublicKeyType): string {
    switch (type) {
      case PublicKeyType.HEX:
        return nip19.decode(this.mostro).data as string
      case PublicKeyType.NPUB:
        return this.mostro
      default:
        return this.mostro
    }
  }

  getNostr(): Nostr {
    return this.nostr
  }
}
