import { EventEmitter } from 'tseep'
import { schnorr } from '@noble/curves/secp256k1'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { getPublicKey, nip44, nip19, nip59, type NostrEvent, type EventTemplate } from 'nostr-tools'
import NDK, { NDKKind, NDKSubscription, NDKEvent, NDKRelay, NDKUser, NDKRelayList, getRelayListForUser, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import { type GiftWrap, type Rumor, type Seal, type UnwrappedEvent } from './types'
import { SigningMode } from '../mostro'
import type { MostroMessage } from '../mostro/types'
import type { KeyProvider } from './key-provider'

/**
 * Maximum number of seconds to be returned in the initial query
 */
const EVENT_INTEREST_WINDOW = 60 * 60 * 24 * 14 // 14 days

// Message kinds
type ExtendedNDKKind = NDKKind | 38383 | 14
export const NOSTR_DIRECT_MESSAGE_KIND: ExtendedNDKKind = 14
export const NOSTR_REPLACEABLE_EVENT_KIND: ExtendedNDKKind = 38383
export const NOSTR_SEAL_KIND = 13
export const NOSTR_GIFT_WRAP_KIND = 1059

export type EventCallback = (event: NDKEvent) => Promise<void>
export type GiftWrapCallback = (rumor: Rumor, seal: Seal) => Promise<void>

export interface NostrOptions {
  relays: string
  mostroPubKey: string
  debug?: boolean
  keyProvider: KeyProvider
}

export class Nostr extends EventEmitter<{
  'ready': () => void,
  'public-message': (event: NDKEvent) => void,
  'private-message': (gift: GiftWrap, seal: Seal, rumor: Rumor) => void,
  'relay:connecting': (relay: NDKRelay) => void,
  'relay:connect': (relay: NDKRelay) => void,
  'relay:ready': (relay: NDKRelay) => void,
  'relay:disconnect': (relay: NDKRelay) => void,
  'relay:auth': (relay: NDKRelay, challenge: string) => void,
  'relay:flapping': (relay: NDKRelay) => void,
  'relay:notice': (relay: NDKRelay, err: any) => void
}> {
  private ndk: NDK
  private users = new Map<string, NDKUser>()
  private subscriptions: Map<number, NDKSubscription> = new Map()
  private dmSubscriptions: Map<string, NDKSubscription> = new Map()
  public mustKeepRelays: Set<string> = new Set()
  private identitySigner: NDKPrivateKeySigner | undefined
  private tradeSigner: NDKPrivateKeySigner | undefined
  private debug: boolean
  private mostroPubKey: string
  private relays: string
  private signingMode: SigningMode = SigningMode.INITIAL
  private keyProvider: KeyProvider

  // Queue for gift wraps in order to process past events in the chronological order
  private giftWrapQueue: NDKEvent[] = []
  private giftWrapEoseReceived: boolean = false

  // Queue for order messages
  private orderQueue: NDKEvent[] = []
  private orderEoseReceived: boolean = false
  private orderSubscriptionComplete: boolean = false

  constructor(opts: NostrOptions) {
    super()
    this.mostroPubKey = opts.mostroPubKey
    this.relays = opts.relays
    this.debug = opts.debug || false
    this.keyProvider = opts.keyProvider

    let cacheAdapter = undefined

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Browser environment
      const dexieAdapter = new NDKCacheAdapterDexie({
        dbName: 'mostro-events-db',
        eventCacheSize: 10000,
        eventTagsCacheSize: 5000,
      })
      dexieAdapter.locking = true
      cacheAdapter = dexieAdapter
    }
    this.ndk = new NDK({
      enableOutboxModel: true,
      cacheAdapter: cacheAdapter,
      autoConnectUserRelays: true,
    })

    for (const relay of this.relays.split(',')) {
      this.debug && console.log(`➕ adding relay: "${relay}"`)
      if (relay.startsWith('ws://') || relay.startsWith('wss://')) {
        const ndkRelay = new NDKRelay(relay, undefined, this.ndk)
        this.ndk.pool.addRelay(ndkRelay, true)
      } else {
        console.warn(`🚨 invalid relay url: "${relay}"`)
      }
    }

    this.setupRelayHandlers()
  }

  setSigningMode(mode: SigningMode) {
    this.signingMode = mode
  }

  getSigningMode(): SigningMode {
    return this.signingMode
  }

  private setupRelayHandlers() {
    this.ndk.pool.on('connect', () => {
      this.debug && console.log(`🎉 connected to all relays`)
      this.emit('ready')
    })
    this.ndk.pool.on('relay:connect', (relay: NDKRelay) => {
      this.debug && console.debug(`🔌 connected to relay: ${relay.url}`)
      this.emit('relay:connect', relay)
    })
    this.ndk.pool.on('relay:connecting', (relay: NDKRelay) => {
      this.debug && console.debug(`🔗 connecting to relay: ${relay.url}...`)
      this.emit('relay:connecting', relay)
    })
    this.ndk.pool.on('relay:ready', (relay: NDKRelay) => {
      this.debug && console.debug(`🎉 relay ${relay.url} is ready`)
      this.emit('relay:ready', relay)
    })
    this.ndk.pool.on('relay:disconnect', (relay: NDKRelay) => {
      this.debug && console.debug(`🚨 disconnected from relay: ${relay.url}`)
      if (!this.mustKeepRelays.has(relay.url)) {
        this.debug && console.debug(`🗑️ removing relay: ${relay.url}`)
        this.ndk.pool.removeRelay(relay.url)
      } else {
        this.debug && console.debug(`🔌 reconnecting relay: ${relay.url}`)
        this.ndk.pool.addRelay(relay, true)
      }
      this.emit('relay:disconnect', relay)
    })
  }

  async connect() {
    await this.ndk.connect(2000)
  }

  addUser(user: NDKUser) {
    if (!this.users.has(user.pubkey)) {
      this.users.set(user.pubkey, user)
      getRelayListForUser(user.pubkey, this.ndk).then((relayList: NDKRelayList | undefined) => {
        if (relayList) {
          this.debug && console.log(`🌐 Relay list for [${user.pubkey}]: `, relayList.tags.map(r => r[1]))
          for (const relayUrl of relayList.relays) {
            this.mustKeepRelays.add(relayUrl)
            const ndkRelay = new NDKRelay(relayUrl, undefined, this.ndk)
            this.ndk.pool.addRelay(ndkRelay, true)
            this.ndk.outboxPool?.addRelay(ndkRelay, true)
          }
        } else {
          this.debug && console.warn(`🚨 No relay list for user [${user.pubkey}], adding default relay`)
          this.ndk.pool.addRelay(new NDKRelay('wss://relay.mostro.network', undefined, this.ndk), true)
        }
      })
    }
  }

  subscribeOrders() {
    this.debug && console.log('📣 subscribing to orders')
    const mostroDecoded = nip19.decode(this.mostroPubKey)
    const filters = {
      kinds: [NOSTR_REPLACEABLE_EVENT_KIND as NDKKind],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
      authors: [mostroDecoded.data as string]
    }
    if (!this.subscriptions.has(NOSTR_REPLACEABLE_EVENT_KIND)) {
      const subscription = this.ndk.subscribe(filters, { closeOnEose: false, subId: 'orders', groupable: true, groupableDelay: 300 })
      subscription.on('event', this.handlePublicMessage.bind(this))
      subscription.on('eose', () => {
        this.debug && console.warn('🔚 order subscription eose')
        this.orderEoseReceived = true
        this.orderSubscriptionComplete = true
        this._processQueuedOrders()
        // Try to subscribe to gift wraps after orders are complete
        this.trySubscribeGiftWraps()
      })
      this.subscriptions.set(NOSTR_REPLACEABLE_EVENT_KIND, subscription)
    } else {
      console.warn('❌ Attempting to subscribe to orders when already subscribed')
    }
  }

  private trySubscribeGiftWraps() {
    if (!this.orderSubscriptionComplete) {
      this.debug && console.log('⏳ Waiting for order subscription to complete before subscribing to gift wraps')
      return
    }

    const myPubKey = this.getIdentityPubKey()
    if (!myPubKey) {
      this.debug && console.log('⏳ No identity pubkey available yet, gift wrap subscription delayed')
      return
    }

    this.subscribeGiftWraps(myPubKey)
  }

  async subscribeGiftWraps(myPubkey: string) {
    this.debug && console.log('📣 subscribing to gift wraps for key: ', myPubkey)
    const filters = {
      kinds: [NOSTR_GIFT_WRAP_KIND],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
    }
    if (!this.dmSubscriptions.has(myPubkey)) {
      const subscription = this.ndk.subscribe(filters, { closeOnEose: false, subId: 'gift-wraps', groupable: true, groupableDelay: 300 })
      subscription.on('event', this.handleGiftWrapMessage.bind(this))
      subscription.on('eose', () => {
        this.debug && console.warn('🔚 gift wrap subscription eose')
        this.giftWrapEoseReceived = true
        this._processQueuedGiftWraps()
      })
      this.dmSubscriptions.set(myPubkey, subscription)
      return new Promise((resolve) => setTimeout(() => resolve(true), 600))
    } else {
      console.warn('❌ Attempting to subscribe to gift wraps when already subscribed')
    }
  }

  private async handleGiftWrapMessage(event: NDKEvent) {
    // Check if event has a 'p' tag that matches our identity public key
    const myPubKey = this.getIdentityPubKey()
    const isForIdentity = event.tags.some(([tagName, tagValue]) =>
      tagName === 'p' && tagValue === myPubKey
    )
    const isForTrade = await Promise.all(event.tags.map(async ([tagName, tagValue]) =>
      tagName === 'p' && await this.keyProvider.isTradeKey(tagValue)
    ))

    const isForMe = isForIdentity || isForTrade

    if (!isForMe) {
      this.debug && console.log('🚫 Ignoring gift wrap event not intended for us')
      return
    }

    this.giftWrapQueue.push(event)
    if (this.giftWrapEoseReceived) {
      this._processQueuedGiftWraps()
    }
  }

  private async _processQueuedGiftWraps() {
    const unwrappedEventQueue: UnwrappedEvent[] = []
    // The first thing we'll do is filter out any gift wraps that are not intended for us
    // For this we have to retrieve all the trade keys from the database
    const tradeKeys = await this.keyProvider.listTradeKeys()
    const myPubKey = this.getIdentityPubKey()
    if (!myPubKey) {
      this.debug && console.log('⏳ No identity pubkey available yet, gift wrap processing delayed')
      return
    }
    const tradeKeysSet = new Set(tradeKeys.concat([myPubKey]))
    const t1 = performance.now()
    const filteredQueue = this.giftWrapQueue.filter((event) => {
      const pubkey = event.tags.find(([tagName, _tagValue]) => tagName === 'p')?.[1]
      return pubkey && tradeKeysSet.has(pubkey)
    })
    const t2 = performance.now()
    console.log(
      `Got ${this.giftWrapQueue.length} gift wraps, ` +
      `excluded ${this.giftWrapQueue.length - filteredQueue.length}, ` +
      `kept ${filteredQueue.length}, T: ${(t2 - t1).toFixed(2)} ms`)
    for (const event of filteredQueue) {
      try {
        const { rumor, seal } = await this.unwrapEvent(event)
        if (rumor.pubkey !== seal.pubkey) {
          this.debug && console.warn('🚨 Mismatch between rumor and seal pubkeys: ', rumor.pubkey, ' != ', seal.pubkey)
          continue
        }
        unwrappedEventQueue.push({ gift: event, rumor, seal })
      } catch (err) {
        console.error('Error unwrapping gift wrap event: ', err)
        console.error('Event: ', event.rawEvent())
      }
    }
    // Sorting rumors by 'created_at' fields. We can only do this after unwrapping
    unwrappedEventQueue.sort((a, b) => (a.rumor.created_at as number) - (b.rumor.created_at as number))
    for (const unwrappedEvent of unwrappedEventQueue) {
      const { gift, rumor, seal } = unwrappedEvent
      this.emit('private-message', gift, seal, rumor)
    }
    this.giftWrapQueue = []
  }

  private handlePublicMessage(event: NDKEvent) {
    this.orderQueue.push(event)
    if (this.orderEoseReceived) {
      this._processQueuedOrders()
    }
  }

  private _processQueuedOrders() {
    this.orderQueue.sort((a, b) => (a.created_at || 0) - (b.created_at || 0))
    for (const event of this.orderQueue) {
      this.emit('public-message', event)
    }
    this.orderQueue = []
  }

  setIdentitySigner(privateKey: string) {
    this.identitySigner = new NDKPrivateKeySigner(privateKey)
    // By default, use identity signer for NDK operations
    this.ndk.signer = this.identitySigner
    // Try to subscribe to gift wraps with the new identity key
    this.trySubscribeGiftWraps()
  }

  setTradeSigner(privateKey: string) {
    this.tradeSigner = new NDKPrivateKeySigner(privateKey)
  }

  getIdentityPubKey(): string | undefined {
    if (this.identitySigner instanceof NDKPrivateKeySigner && this.identitySigner.privateKey) {
      return getPublicKey(Buffer.from(this.identitySigner.privateKey, 'hex'))
    }
    return undefined
  }

  getTradePubKey(): string | undefined {
    if (this.tradeSigner instanceof NDKPrivateKeySigner && this.tradeSigner.privateKey) {
      return getPublicKey(Buffer.from(this.tradeSigner.privateKey, 'hex'))
    }
    return undefined
  }

  async unwrapEvent(event: NDKEvent): Promise<{rumor: Rumor, seal: Seal}> {
    const nostrEvent = await event.toNostrEvent()

    // Get key for unwrapping the seal
    const destinationPubkey = nostrEvent.tags.find(([tagName, _tagValue]) => tagName === 'p')![1]

    // Lookup the private key for the destination pubkey
    const destinationPrivateKey = await this.keyProvider.getPrivateKeyFor(destinationPubkey)

    if(!destinationPrivateKey) {
      throw new Error(`No key available to unwrap seal, pubkey: ${destinationPubkey}`)
    }

    const unwrappedSeal: Seal = this.nip44Decrypt(
      nostrEvent as NostrEvent,
      Buffer.from(destinationPrivateKey, 'hex')
    )

    const rumor = this.nip44Decrypt(
      unwrappedSeal,
      Buffer.from(destinationPrivateKey, 'hex')
    )
    return { rumor, seal: unwrappedSeal }
  }

  async createAndPublishMostroEvent(payload: MostroMessage, mostroPubKey: string): Promise<{rumor: Rumor, seal: Seal, giftWrap: NostrEvent}> {
    if (!this.tradeSigner) {
      throw new Error('No trade signer available to create event')
    }

    const cleartext = JSON.stringify(payload)
    const myPubKey = this.getTradePubKey()
    if (!myPubKey) {
      throw new Error('No trade pubkey found')
    }
    console.log('🔑 Using trade key: [priv: ', this.tradeSigner?.privateKey, ', pub: ', myPubKey, '] for mostro event')

    const rumorEvent = new NDKEvent(this.ndk)
    rumorEvent.kind = NDKKind.Text
    rumorEvent.created_at = Math.floor(Date.now() / 1000)
    rumorEvent.content = cleartext
    rumorEvent.pubkey = myPubKey
    rumorEvent.tags = [['p', mostroPubKey]]
    const nEvent = await rumorEvent.toNostrEvent()
    this.debug && console.info('[🎁][me -> 🧌]: ', nEvent)
    return await this.giftWrapAndPublishMostroEvent(rumorEvent, mostroPubKey)
  }

  async sendDirectMessageToPeer(message: string, destination: string, tags: string[][]): Promise<void> {
    if (!this.identitySigner) {
      throw new Error('No identity signer available to send message')
    }

    const event = new NDKEvent(this.ndk)
    event.kind = NOSTR_DIRECT_MESSAGE_KIND
    event.created_at = Math.floor(Date.now() / 1000)
    event.content = message
    event.pubkey = this.getIdentityPubKey()!
    event.tags = tags
    this.debug && console.log(`💬 sending direct message to 👤: ${message}`)
    return this.giftWrapAndPublishPeerEvent(event, destination)
  }

  /**
   * Gift wrap and publish a mostro event. The communication with mostro is more nuanced, so we need to use
   * both the identity and trade keys, depending on the context. For introductions (new trades being taken or created)
   * we use the identity key, for orders we use the trade key.
   * 
   * @param event - The event to gift wrap and publish
   * @param destination - The mostro pubkey to send the event to
   * @returns 
   */
  async giftWrapAndPublishMostroEvent(event: NDKEvent, destination: string): Promise<{rumor: Rumor, seal: Seal, giftWrap: NostrEvent}> {
    // Use trade signer for order-related events, identity signer for everything else
    const sealSigner = this.signingMode === SigningMode.TRADE ? this.tradeSigner : this.identitySigner
    if (!sealSigner || !(sealSigner instanceof NDKPrivateKeySigner)) {
      throw new Error('No appropriate seal signer available')
    }

    const rumorSigner = this.signingMode === SigningMode.TRADE ? this.tradeSigner : this.identitySigner
    if (!rumorSigner || !(rumorSigner instanceof NDKPrivateKeySigner)) {
      throw new Error('No appropriate rumor signer available')
    }

    // Parse the content if it's a string representation of JSON
    const contentObj = typeof event.content === 'string' ? JSON.parse(event.content) : event.content
    if (this.signingMode === SigningMode.INITIAL) {
    // If we're in the initial signing mode, we need to sign the SHA-256 of the serialized content
    // and provide the signature in the second element of the array
      const innerMessageObj = contentObj.order
      const content = JSON.stringify(innerMessageObj, null, 0)
      const sha256Content = sha256(content)
      const signature = bytesToHex(schnorr.sign(sha256Content, this.tradeSigner!.privateKey!))
      event.content = JSON.stringify([contentObj, signature])
      console.log('🎁 initial signing mode, content: ', event.content)
    } else {
      // For all other signing modes, we send a null signature
      event.content = JSON.stringify([contentObj, null])
      console.log('🎁 trade signing mode, content: ', event.content)
    }

    const sealPrivateKey = Buffer.from(sealSigner.privateKey!, 'hex')
    const rumorPrivateKeyUint8 = Buffer.from(this.tradeSigner!.privateKey!, 'hex')
    const rumor = nip59.createRumor(event.rawEvent(), rumorPrivateKeyUint8)
    const seal = nip59.createSeal(rumor, sealPrivateKey, destination)
    const giftWrap = nip59.createWrap(seal, destination)
    await this.publishEvent(new NDKEvent(this.ndk, giftWrap))
    return { rumor, seal, giftWrap }
  }

  /**
   * Gift wrap and publish a peer event directed to a trade peer. The peer will always talk to a trade key, so no
   * mention of an identity key is needed here.
   * 
   * @param event - The event to gift wrap and publish
   * @param destination - The mostro pubkey to send the event to
   * @returns 
   */
  async giftWrapAndPublishPeerEvent(event: NDKEvent, destination: string): Promise<void> {
    const tradeKey = Buffer.from(this.tradeSigner!.privateKey!, 'hex')
    const rumor = nip59.createRumor(event.rawEvent(), tradeKey)
    const seal = nip59.createSeal(rumor, tradeKey, destination)
    const giftWrappedEvent = nip59.createWrap(seal, destination)
    return await this.publishEvent(new NDKEvent(this.ndk, giftWrappedEvent))
  }

  async publishEvent(event: NDKEvent) {
    try {
      const poolSize = this.ndk.pool.size()
      const relays = await event.publish()
      this.debug && console.log(`📡 Event published to [${relays.size}/${poolSize}] relays`)
    } catch (err) {
      console.error('Error publishing event: ', err)
    }
  }

  nip44ConversationKey(privateKey: Uint8Array, publicKey: string) {
    return nip44.v2.utils.getConversationKey(Buffer.from(privateKey), publicKey)
  }

  nip44Encrypt(data: EventTemplate, privateKey: Uint8Array, publicKey: string) {
    return nip44.v2.encrypt(JSON.stringify(data), this.nip44ConversationKey(privateKey, publicKey))
  }

  nip44Decrypt(data: NostrEvent, privateKey: Uint8Array) {
    return JSON.parse(nip44.v2.decrypt(data.content, this.nip44ConversationKey(privateKey, data.pubkey)))
  }

  unsubscribeGiftWraps() {
    this.debug && console.log('🚫 unsubscribing from gift wraps')
    const subscription = this.subscriptions.get(NOSTR_GIFT_WRAP_KIND)
    if (subscription) {
      subscription.stop()
      this.subscriptions.delete(NOSTR_GIFT_WRAP_KIND)
    }
    // Reset gift wrap state
    this.giftWrapQueue = []
    this.giftWrapEoseReceived = false
  }
}