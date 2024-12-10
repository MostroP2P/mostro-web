import { EventEmitter } from 'tseep'
import { generateSecretKey, getPublicKey, nip44, nip19, finalizeEvent, getEventHash, type UnsignedEvent, type NostrEvent, type EventTemplate } from 'nostr-tools'
import NDK, { NDKKind, NDKSubscription, NDKEvent, NDKRelay, type NDKUserProfile, NDKUser, NDKRelayList, getRelayListForUser, type NDKSigner, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import { type GiftWrap, type Rumor, type Seal, type UnwrappedEvent } from './types'

/**
 * Maximum number of seconds to be returned in the initial query
 */
const EVENT_INTEREST_WINDOW = 60 * 60 * 24 * 14 // 14 days

/**
 * The amount of time that the gift wrap timestamp will randomly shifted every time
 */
const GIFT_WRAP_TIME_WINDOW = 2 * 24 * 60 * 60

interface GetUserParams {
  npub?: string
  pubkey?: string
}

// Message kinds
type ExtendedNDKKind = NDKKind | 38383 | 14
export const NOSTR_DIRECT_MESSAGE_KIND: ExtendedNDKKind = 14
export const NOSTR_REPLACEABLE_EVENT_KIND: ExtendedNDKKind = 38383
export const NOSTR_SEAL_KIND = 13
export const NOSTR_GIFT_WRAP_KIND = 1059


interface NIP04Parties {
  sender: NDKUser
  recipient: NDKUser
}

export type EventCallback = (event: NDKEvent) => Promise<void>
export type GiftWrapCallback = (rumor: Rumor, seal: Seal) => Promise<void>

export interface NostrOptions {
  relays: string
  mostroPubKey: string
  debug?: boolean
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
  public mustKeepRelays: Set<string> = new Set()
  private _signer: NDKSigner | undefined

  // Queue for gift wraps in order to process past events in the chronological order
  private giftWrapQueue: NDKEvent[] = []
  private giftWrapEoseReceived: boolean = false

  // Queue for order messages
  private orderQueue: NDKEvent[] = []
  private orderEoseReceived: boolean = false

  private options: NostrOptions
  private debug: boolean

  constructor(options: NostrOptions) {
    super()
    this.options = options
    this.debug = options.debug || false

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
    this.ndk.pool.on('flapping', (relay: NDKRelay) => {
      this.debug && console.debug(`🔄 flapping relay: ${relay.url}`)
      this.emit('relay:flapping', relay)
    })
    this.ndk.pool.on('notice', (relay: NDKRelay, err: any) => {
      this.debug && console.warn(`>>> Notice from relay ${relay.url}: ${err}`)
      this.emit('relay:notice', relay, err)
    })
    this.ndk.pool.on('relay:auth', (relay: NDKRelay, challenge: string) => {
      this.debug && console.debug(`🔑 relay ${relay.url} requires auth. Challenge: ${challenge}`)
      this.emit('relay:auth', relay, challenge)
    })
    this.ndk.outboxPool?.on('relay:connect', (relay: NDKRelay) => {
      this.debug && console.log(`🎉 connected to outbox relay: ${relay.url}`)
    })

    const { relays } = this.options
    for (const relay of relays.split(',')) {
      this.debug && console.log(`➕ adding relay: "${relay}"`)
      if (relay.startsWith('ws://') || relay.startsWith('wss://')) {
        const ndkRelay = new NDKRelay(relay, undefined, this.ndk)
        this.ndk.pool.addRelay(ndkRelay, true)
      } else {
        console.warn(`🚨 invalid relay url: "${relay}"`)
      }
    }
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

  getUser(pubkey: string): NDKUser | undefined {
    return this.users.get(pubkey)
  }

  public set signer(signer: NDKSigner | undefined) {
    this._signer = signer
  }

  public get signer() : NDKSigner | undefined {
    return this._signer
  }

  // Instead of calling callbacks, emit events
  private async _handleEvent(event: NDKEvent, relay: NDKRelay | undefined, subscription: NDKSubscription) {
    // Emit public-message directly instead of calling handlePublicMessage
    this.emit('public-message', event)
  }

  private _handleDupEvent(
    eventId: string,
    _relay: NDKRelay | undefined,
    _timeSinceFirstSeen: number,
    _subscription: NDKSubscription
  ) {
    // console.debug(`🧑‍🤝‍🧑 duplicate event [${eventId}]`)
  }

  private _handleCloseSubscription(subscription: NDKSubscription) {
    this.debug && console.warn('🔚 subscription closed: ', subscription)
    // Find the event kind associated with the closed subscription
    const eventKind = Array.from(this.subscriptions.entries()).find(([_, sub]) => sub === subscription)?.[0]
    if (eventKind !== undefined) {
      this.subscriptions.delete(eventKind)
    } else {
      console.warn('🚨 Subscription not found in the subscriptions map')
    }
  }

  private async _queueGiftWrapEvent(event: NDKEvent) {
    const myPubKey = this.getMyPubKey()

    // Check if event has a 'p' tag that matches our public key
    const isForMe = event.tags.some(([tagName, tagValue]) => 
      tagName === 'p' && tagValue === myPubKey
    )

    if (!isForMe) {
      console.log('🚫 Ignoring gift wrap event not intended for us')
      return
    }
    this.giftWrapQueue.push(event)
    if (this.giftWrapEoseReceived) {
      await this._processQueuedGiftWraps()
    } else {
      console.warn('🚨 gift wrap eose not received yet')
    }
  }

  private _queueOrderEvent(event: NDKEvent) {
    this.orderQueue.push(event)
    if (this.orderEoseReceived) {
      this._processQueuedOrders()
    }
  }

  private _handleOrderEose() {
    this.debug && console.warn('🔚 order subscription eose')
    this.orderEoseReceived = true
    this._processQueuedOrders()
  }

  private async _handleGiftWrapEose() {
    this.debug && console.warn('🔚 gift wrap subscription eose')
    this.giftWrapEoseReceived = true
    await this._processQueuedGiftWraps()
  }

  private _processQueuedOrders() {
    this.orderQueue.sort((a, b) => (a.created_at || 0) - (b.created_at || 0))
    for (const event of this.orderQueue) {
      this._handleEvent(event, undefined, this.subscriptions.get(NOSTR_REPLACEABLE_EVENT_KIND)!)
    }
    this.orderQueue = []
  }

  private async _processQueuedGiftWraps() {
    const unwrappedEventQueue: UnwrappedEvent[] = []
    for (const event of this.giftWrapQueue) {
      try {
        const { rumor, seal } = await this.unwrapEvent(event)
        if (rumor.pubkey !== seal.pubkey) {
          console.warn('🚨 Mismatch between rumor and seal pubkeys: ', rumor.pubkey, ' != ', seal.pubkey)
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

  subscribeOrders() {
    this.debug && console.log('📣 subscribing to orders')
    const mostroNpub = this.options.mostroPubKey
    const mostroDecoded = nip19.decode(mostroNpub)
    const filters = {
      kinds: [NOSTR_REPLACEABLE_EVENT_KIND as NDKKind],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
      authors: [mostroDecoded.data as string]
    }
    if (!this.subscriptions.has(NOSTR_REPLACEABLE_EVENT_KIND)) {
      const subscription = this.ndk.subscribe(filters, { closeOnEose: false, subId: 'orders', groupable: true, groupableDelay: 300 })
      subscription.on('event', this._queueOrderEvent.bind(this))
      subscription.on('event:dup', this._handleDupEvent.bind(this))
      subscription.on('eose', this._handleOrderEose.bind(this))
      subscription.on('close', this._handleCloseSubscription.bind(this))
      this.subscriptions.set(NOSTR_REPLACEABLE_EVENT_KIND, subscription)
    } else {
      console.warn('❌ Attempting to subcribe to orders when already subscribed')
    }
  }

  subscribeGiftWraps(myPubkey: string) {
    this.debug && console.log('📣 subscribing to gift wraps')
    const filters = {
      kinds: [NOSTR_GIFT_WRAP_KIND],
      '#p': [myPubkey],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
    }
    if (!this.subscriptions.has(NOSTR_GIFT_WRAP_KIND)) {
      const subscription = this.ndk.subscribe(filters, { closeOnEose: false, subId: 'gift-wraps', groupable: true, groupableDelay: 300 })
      subscription.on('event', this._queueGiftWrapEvent.bind(this))
      subscription.on('event:dup', this._handleDupEvent.bind(this))
      subscription.on('eose', this._handleGiftWrapEose.bind(this))
      subscription.on('close', this._handleCloseSubscription.bind(this))
      this.subscriptions.set(NOSTR_GIFT_WRAP_KIND, subscription)
    } else {
      console.warn('❌ Attempting to subcribe to gift wraps when already subscribed')
    }
  }

  unsubscribeGiftWraps() {
    console.log('🚫 unsubscribing from gift wraps')
    const subscription = this.subscriptions.get(NOSTR_GIFT_WRAP_KIND)
    if (subscription) {
      subscription.stop()
      this.subscriptions.delete(NOSTR_GIFT_WRAP_KIND)
    }
  }

  async unwrapEvent(event: NDKEvent): Promise<{rumor: Rumor, seal: Seal}> {
    const nostrEvent = await event.toNostrEvent()
    const unwrappedSeal: Seal = this.nip44Decrypt(
      nostrEvent as NostrEvent,
      Buffer.from((this.signer as NDKPrivateKeySigner).privateKey?.toString() || '', 'hex')
    )
    const rumor = this.nip44Decrypt(
      unwrappedSeal,
      Buffer.from((this.signer as NDKPrivateKeySigner).privateKey?.toString() || '', 'hex')
    )
    return { rumor, seal: unwrappedSeal }
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

  async fetchProfile(params: GetUserParams) : Promise<NDKUserProfile | null> {
    const user = this.ndk.getUser(params)
    if (!user) return null
    return await user.fetchProfile()
  }

  async signEvent(event: NDKEvent): Promise<void> {
    if (this._signer) {
      await event.sign(this._signer)
    } else {
      throw new Error('No signer available to sign the event')
    }
  }

  async decryptMessage(ev: NDKEvent): Promise<string> {
    if (!this._signer) {
      throw new Error('No signer available to decrypt the message')
    }
    const { sender, recipient } = this.obtainParties(ev)

    if (sender.pubkey === this.getMyPubKey()) {
      // I was the sender
      return await this._signer.decrypt(recipient, ev.content)
    } else {
      // I was the recipient
      return await this._signer.decrypt(sender, ev.content)
    }
  }

  /**
   * Function used to extract the two participating parties in this communication.
   *
   * @param ev - The event from which to extract the parties
   * @returns The two parties
   */
  obtainParties(ev: NDKEvent) : NIP04Parties {
    if (ev.kind !== 4) {
      throw Error('Trying to obtain parties of a non NIP-04 message')
    }
    const parties = ev.tags
      .filter(([k, _v]) => k === 'p')
    const _recipient = parties.find(([k, v]) => k === 'p' && v !== ev.author.pubkey)
    if (!_recipient) {
      console.error(`No recipient found in event: `, ev.rawEvent())
      throw new Error(`No recipient found in event with id: ${ev.rawEvent().id}`)
    }
    const recipient = new NDKUser({
      hexpubkey: _recipient[1]
    })
    return {
      sender: ev.author,
      recipient
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

  now() {
    return Math.round(Date.now() / 1000)
  }

  randomNow() {
    return Math.round(this.now() - (Math.random() * GIFT_WRAP_TIME_WINDOW))
  }

  createRumor(event: Partial<UnsignedEvent>, privateKey: Uint8Array) : Rumor {
    const rumor = {
      ...event,
      created_at: this.now(),
      pubkey: getPublicKey(privateKey),
    } as any

    rumor.id = getEventHash(rumor)
    return rumor as Rumor
  }

  createSeal(rumor: Rumor, privateKey: Uint8Array, recipientPublicKey: string) : NostrEvent {
    return finalizeEvent(
      {
        kind: NOSTR_SEAL_KIND,
        content: this.nip44Encrypt(rumor, privateKey, recipientPublicKey),
        created_at: this.randomNow(),
        tags: [],
      },
      privateKey
    ) as NostrEvent
  }

  createWrap(event: NostrEvent, recipientPublicKey: string) : NostrEvent {
    const randomKey = generateSecretKey()
    return finalizeEvent(
      {
        kind: NOSTR_GIFT_WRAP_KIND,
        content: this.nip44Encrypt(event, randomKey, recipientPublicKey),
        created_at: this.randomNow(),
        tags: [['p', recipientPublicKey]],
      },
      randomKey
    ) as NostrEvent
  }

  updatePrivKey(newPrivKey: string | null) {
    if (newPrivKey) {
      try {
        const newPubKey = getPublicKey(Buffer.from(newPrivKey, 'hex'))
        this.signer = new NDKPrivateKeySigner(newPrivKey)
        this.updatePubKey(newPubKey)
      } catch (err) {
        console.error('Error while trying to decode nsec: ', err);
      }
    } else {
      console.warn('🔑 clearing priv key')
      this.signer = undefined;
    }
  }

  updatePubKey(newPubKey: string | null | undefined) {
    if (newPubKey) {
      this.subscribeGiftWraps(newPubKey);
    } else {
      this.unsubscribeGiftWraps()
    }
  }

  getMyPubKey(): string {
    if (this._signer instanceof NDKPrivateKeySigner && this._signer.privateKey) {
      return getPublicKey(Buffer.from(this._signer.privateKey, 'hex'))
    } else {
      throw new Error('No signer available to get pubkey')
    }
  }

  async sendDirectMessageToPeer(message: string, destination: string, tags: string[][]): Promise<void> {
    const event = new NDKEvent(this.ndk)
    event.kind = NOSTR_DIRECT_MESSAGE_KIND,
    event.created_at = Math.floor(Date.now() / 1000)
    event.content = message
    event.pubkey = this.getMyPubKey()
    event.tags = tags
    this.debug && console.log(`💬 sending direct message to 👤: ${message}`)
    return this.giftWrapAndPublishEvent(event, destination)
  }

  async giftWrapAndPublishEvent(event: NDKEvent, destination: string): Promise<void> {
    if (this._signer instanceof NDKPrivateKeySigner) {
      if (!this._signer.privateKey) {
        console.error('❗ No private key found')
        return
      }
      const privateKeyBuffer = Buffer.from(this._signer.privateKey, 'hex')
      const rumor = this.createRumor(event.rawEvent(), privateKeyBuffer)
      const seal = this.createSeal(rumor, privateKeyBuffer, destination)
      const giftWrappedEvent = this.createWrap(seal, destination)
      return await this.publishEvent(new NDKEvent(this.ndk, giftWrappedEvent))
    } else {
      throw new Error('NDKNip07Signer is no longer supported. Please use NDKPrivateKeySigner.')
    }
  }

  async createAndPublishMostroEvent(payload: object, mostroPubKey: string): Promise<void> {
    const cleartext = JSON.stringify(payload)
    // const myPubKey = await this._signer?.user().then(user => user.pubkey)
    const myPubKey = this.getMyPubKey()
    if (!myPubKey) {
      console.error(`No pubkey found`)
      return
    }
    const event = new NDKEvent(this.ndk)
    event.kind = NDKKind.Text,
    event.created_at = Math.floor(Date.now() / 1000)
    event.content = cleartext
    event.pubkey = myPubKey
    event.tags = [['p', mostroPubKey]]
    const nEvent = await event.toNostrEvent()
    this.debug && console.info('[🎁][me -> 🧌]: ', nEvent)
    return await this.giftWrapAndPublishEvent(event, mostroPubKey)
  }
}