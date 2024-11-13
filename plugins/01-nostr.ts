// import NDK, { NDKKind, NDKSubscription, NDKEvent, NDKRelay, type NDKUserProfile, NDKUser, NDKRelayList, getRelayListForUser, type NDKSigner } from '@nostr-dev-kit/ndk'
// import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
// import { generateSecretKey, getPublicKey, nip44, nip19, finalizeEvent, getEventHash, type UnsignedEvent, type EventTemplate, type Event as NostrEvent } from 'nostr-tools'
// import { useRelays } from '~/stores/relays'
// import { AuthMethod, useAuth } from '@/stores/auth'
// import { NDKPrivateKeySigner, NDKNip07Signer } from '@nostr-dev-kit/ndk'
// import { watch } from 'vue'
// import type { MostroEvent } from './02-mostro'

// /**
//  * Maximum number of seconds to be returned in the initial query
//  */
// const EVENT_INTEREST_WINDOW = 60 * 60 * 24 * 14 // 14 days

// /**
//  * The amount of time that the gift wrap timestamp will randomly shifted every time
//  */
// const GIFT_WRAP_TIME_WINDOW = 2 * 24 * 60 * 60

// interface GetUserParams {
//   npub?: string
//   pubkey?: string
// }

// // Message kinds
// type ExtendedNDKKind = NDKKind | 38383
// export const NOSTR_REPLACEABLE_EVENT_KIND: ExtendedNDKKind = 38383
// export const NOSTR_TEXT_KIND: NDKKind = NDKKind.Text
// export const NOSTR_ENCRYPTED_DM_KIND = NDKKind.EncryptedDirectMessage
// export const NOSTR_SEAL_KIND = 13
// export const NOSTR_GIFT_WRAP_KIND = 1059


// interface NIP04Parties {
//   sender: NDKUser
//   recipient: NDKUser
// }

// type Rumor = UnsignedEvent & {id: string}
// type Seal = NostrEvent

// export type EventCallback = (event: NDKEvent) => Promise<void>
// export type GiftWrapCallback = (rumor: Rumor, seal: NostrEvent) => Promise<void>

// export class Nostr {
//   private static ndkInstance: NDK
//   private users = new Map<string, NDKUser>()
//   private subscriptions: Map<number | string, NDKSubscription> = new Map()
//   private eventCallbacks: Map<number, EventCallback | GiftWrapCallback> = new Map()
//   private mostroMessageCallback: (message: string, ev: MostroEvent) => void = () => {}
//   private peerMessageCallback: (message: string, ev: MostroEvent) => void = () => {}
//   public mustKeepRelays: Set<string> = new Set()
//   private _signer: NDKSigner | undefined

//   // Queue for DMs in order to process past events in the chronological order
//   private dmQueue: NDKEvent[] = []
//   private dmEoseReceived: boolean = false

//   // Queue for gift wraps in order to process past events in the chronological order
//   private giftWrapQueue: NDKEvent[] = []
//   private giftWrapEoseReceived: boolean = false

//   constructor() {
//     const config = useRuntimeConfig()
//     const { public: { relays } } = config

//     // Instantiating the dexie adapter
//     const dexieAdapter = new NDKCacheAdapterDexie({
//       dbName: 'mostro-events-db',
//       eventCacheSize: 10000,
//       eventTagsCacheSize: 5000,
//     })
//     dexieAdapter.locking = true
//     Nostr.ndkInstance = new NDK({
//       enableOutboxModel: true,
//       cacheAdapter: dexieAdapter,
//       autoConnectUserRelays: true,
//     })
//     for (const relay of relays.split(',')) {
//       console.log(`🔌 adding relay: "${relay}"`)
//       if (relay.startsWith('ws://') || relay.startsWith('wss://')) {
//         Nostr.ndkInstance.pool.addRelay(new NDKRelay(relay, undefined, Nostr.ndkInstance), true)
//       } else {
//         console.warn(`🚨 invalid relay url: "${relay}"`)
//       }
//     }
//     this.ndk.connect(2000)
//   }
  
//   get ndk(): NDK {
//     return Nostr.ndkInstance
//   }

//   addUser(user: NDKUser) {
//     if (!this.users.has(user.pubkey)) {
//       this.users.set(user.pubkey, user)
//       getRelayListForUser(user.pubkey, this.ndk).then((relayList: NDKRelayList | undefined) => {
//         if (relayList) {
//           console.log(`🌐 Relay list for [${user.pubkey}]: `, relayList.tags.map(r => r[1]), `, from event: ${relayList.id} - [${relayList.created_at}]`)
//           for (const relayUrl of relayList.relays) {
//             this.mustKeepRelays.add(relayUrl)
//             const ndkRelay = new NDKRelay(relayUrl, undefined, Nostr.ndkInstance)
//             this.ndk.pool.addRelay(ndkRelay, true)
//             this.ndk.outboxPool?.addRelay(ndkRelay, true)
//           }
//           console.log(`Must keep relays: `, this.mustKeepRelays)
//         } else {
//           console.warn(`🚨 No relay list for user [${user.pubkey}]`)
//         }
//       })
//     }
//   }

//   getUser(pubkey: string): NDKUser | undefined {
//     return this.users.get(pubkey)
//   }

//   public set signer(signer: NDKSigner | undefined) {
//     this._signer = signer
//   }

//   public get signer() : NDKSigner | undefined {
//     return this._signer
//   }

//   registerEventHandler(eventKind: number, callback: EventCallback | GiftWrapCallback) {
//     this.eventCallbacks.set(eventKind, callback)
//   }

//   registerToMostroMessage(callback: (message: string, ev: MostroEvent) => void) {
//     this.mostroMessageCallback = callback
//   }

//   registerToPeerMessage(callback: (message: string, ev: MostroEvent) => void) {
//     this.peerMessageCallback = callback
//   }

//   private async _handleEvent(event: NDKEvent, relay: NDKRelay | undefined, subscription: NDKSubscription) {
//     if (!event?.kind) {
//       console.warn(`🚨 No event kind found for event: `, event.rawEvent())
//       return
//     }
//     const callback = this.eventCallbacks.get(event.kind)
//     if (callback) {
//       (callback as EventCallback)(event)
//     } else {
//       console.warn(`🚨 No event callback set for kind ${event.kind}`)
//     }
//   }

//   private _handleDupEvent(
//     eventId: string,
//     _relay: NDKRelay | undefined,
//     _timeSinceFirstSeen: number,
//     _subscription: NDKSubscription
//   ) {
//     // console.debug(`🧑‍🤝‍🧑 duplicate event [${eventId}]`)
//   }

//   private _handleCloseSubscription(subscription: NDKSubscription) {
//     console.warn('🔚 subscription closed: ', subscription)
//     // Find the event kind associated with the closed subscription
//     const eventKind = Array.from(this.subscriptions.entries()).find(([_, sub]) => sub === subscription)?.[0]
//     if (eventKind !== undefined) {
//       this.subscriptions.delete(eventKind)
//     } else {
//       console.warn('🚨 Subscription not found in the subscriptions map')
//     }
//   }

//   private _queuePrivateEvent(event: NDKEvent) {
//     this.dmQueue.push(event)
//     if (this.dmEoseReceived) {
//       this._processQueuedEvents()
//     }
//   }

//   private async _queueGiftWrapEvent(event: NDKEvent) {
//     const authStore = useAuth()
//     const myPubKey = authStore.pubKey

//     // Check if event has a 'p' tag that matches our public key
//     const isForMe = event.tags.some(([tagName, tagValue]) => 
//       tagName === 'p' && tagValue === myPubKey
//     )

//     if (!isForMe) {
//       console.log('🚫 Ignoring gift wrap event not intended for us')
//       return
//     }
//     console.log('🎁 queueing gift wrap event')
//     this.giftWrapQueue.push(event)
//     if (this.giftWrapEoseReceived) {
//       await this._processQueuedGiftWraps()
//     }
//   }

//   private _handleDMEose() {
//     console.warn('🔚 DM subscription eose')
//     this.dmEoseReceived = true
//     this._processQueuedEvents()
//   }

//   private async _handleGiftWrapEose() {
//     console.warn('🔚 gift wrap subscription eose')
//     this.giftWrapEoseReceived = true
//     await this._processQueuedGiftWraps()
//   }

//   private _processQueuedEvents() {
//     this.dmQueue.sort((a, b) => (a.created_at || 0) - (b.created_at || 0))
//     for (const event of this.dmQueue) {
//       this._handleEvent(event, undefined, this.subscriptions.get(NOSTR_ENCRYPTED_DM_KIND)!)
//     }
//     this.dmQueue = []
//   }

//   private async _processQueuedGiftWraps() {
//     type RumorAndSeal = { rumor: Rumor, seal: Seal }
//     const rumorQueue: RumorAndSeal[] = []
//     for (const event of this.giftWrapQueue) {
//       try {
//         const { rumor, seal } = await this.unwrapEvent(event)
//         rumorQueue.push({ rumor, seal })
//       } catch (err) {
//         console.error('Error unwrapping gift wrap event: ', err)
//       }
//     }
//     // Sorting rumors by 'created_at' fields. We can only do this after unwrapping
//     rumorQueue.sort((a, b) => (a.rumor.created_at as number) - (b.rumor.created_at as number))
//     for (const { rumor, seal } of rumorQueue) {
//       await this.handleGiftWrapEvent(rumor, seal)
//     }
//     this.giftWrapQueue = []
//   }

//   subscribeOrders() {
//     console.log('📣 subscribing to orders')
//     const config = useRuntimeConfig()
//     const mostroNpub = config.public.mostroPubKey
//     const mostroDecoded = nip19.decode(mostroNpub)
//     const filters = {
//       kinds: [NOSTR_REPLACEABLE_EVENT_KIND as NDKKind],
//       since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
//       authors: [mostroDecoded.data as string]
//     }
//     if (!this.subscriptions.has(NOSTR_REPLACEABLE_EVENT_KIND)) {
//       const subscription = this.ndk.subscribe(filters, { closeOnEose: false })
//       subscription.on('event', this._handleEvent.bind(this))
//       subscription.on('event:dup', this._handleDupEvent.bind(this))
//       subscription.on('close', this._handleCloseSubscription.bind(this))
//       this.subscriptions.set(NOSTR_REPLACEABLE_EVENT_KIND, subscription)
//     } else {
//       console.error('❌ Attempting to subcribe to orders when already subscribed')
//     }
//   }

//   subscribeDMs(myPubkey: string) {
//     console.log('📭 subscribing to DMs')
//     const filters = {
//       kinds: [NOSTR_ENCRYPTED_DM_KIND],
//       '#p': [myPubkey],
//       since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
//     }
//     if (!this.subscriptions.has(NOSTR_ENCRYPTED_DM_KIND)) {
//       const subscription = this.ndk.subscribe(filters, { closeOnEose: false })
//       subscription.on('event', this._queuePrivateEvent.bind(this))
//       subscription.on('event:dup', this._handleDupEvent.bind(this))
//       subscription.on('eose', this._handleDMEose.bind(this))
//       subscription.on('close', this._handleCloseSubscription.bind(this))
//       this.subscriptions.set(NOSTR_ENCRYPTED_DM_KIND, subscription)
//     } else {
//       console.error('❌ Attempting to subcribe to DMs when already subscribed')
//     }
//   }

//   subscribeGiftWraps(myPubkey: string) {
//     const filters = {
//       kinds: [NOSTR_GIFT_WRAP_KIND],
//       '#p': [myPubkey],
//       since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
//     }
//     if (!this.subscriptions.has(NOSTR_GIFT_WRAP_KIND)) {
//       const subscription = this.ndk.subscribe(filters, { closeOnEose: false })
//       subscription.on('event', this._queueGiftWrapEvent.bind(this))
//       subscription.on('event:dup', this._handleDupEvent.bind(this))
//       subscription.on('eose', this._handleGiftWrapEose.bind(this))
//       subscription.on('close', this._handleCloseSubscription.bind(this))
//       this.subscriptions.set(`${NOSTR_GIFT_WRAP_KIND}-${myPubkey}`, subscription)
//       // this.registerEventHandler(NOSTR_GIFT_WRAP_KIND, this.handleGiftWrapEvent.bind(this));
//     } else {
//       console.error('❌ Attempting to subcribe to gift wraps when already subscribed')
//     }
//   }

//   async unwrapEvent(event: NDKEvent): Promise<{rumor: Rumor, seal: Seal}> {
//     const nostrEvent = await event.toNostrEvent()
//     const seal: Seal = this.nip44Decrypt(
//       nostrEvent as NostrEvent,
//       Buffer.from((this.signer as NDKPrivateKeySigner).privateKey?.toString() || '', 'hex')
//     )
//     const rumor = this.nip44Decrypt(
//       seal,
//       Buffer.from((this.signer as NDKPrivateKeySigner).privateKey?.toString() || '', 'hex')
//     )
//     return { rumor, seal }
//   }

//   async handleGiftWrapEvent(rumor: Rumor, seal: Seal) : Promise<void> {
//     const config = useRuntimeConfig()
//     const mostroNpub = config.public.mostroPubKey
//     const mostroHex = nip19.decode(mostroNpub).data as string
//     if (rumor.pubkey === mostroHex) {
//       // Message from mostro
//       this.mostroMessageCallback(rumor.content, rumor as MostroEvent)
//     } else {
//       // Message from a peer
//       console.log('rumor: ', rumor)
//       this.peerMessageCallback(rumor.content, rumor as MostroEvent)
//     }
//   }

//   unsubscribeDMs() {
//     console.log('🚫 unsubscribing to DMs')
//     const subscription = this.subscriptions.get(NOSTR_ENCRYPTED_DM_KIND)
//     if (subscription) {
//       subscription.stop()
//       this.subscriptions.delete(NOSTR_ENCRYPTED_DM_KIND)
//     }
//     this.dmQueue = []
//     this.dmEoseReceived = false
//   }

//   async publishEvent(event: NDKEvent) {
//     try {
//       const poolSize = this.ndk.pool.size()
//       const relays = await event.publish()
//       console.log(`📡 Event published to [${relays.size}/${poolSize}] relays`)
//     } catch (err) {
//       console.error('Error publishing event: ', err)
//     }
//   }

//   async fetchProfile(params: GetUserParams) : Promise<NDKUserProfile | null> {
//     const user = this.ndk.getUser(params)
//     if (!user) return null
//     return await user.fetchProfile()
//   }

//   async signEvent(event: NDKEvent): Promise<void> {
//     if (this._signer) {
//       await event.sign(this._signer)
//     } else {
//       throw new Error('No signer available to sign the event')
//     }
//   }

//   async decryptMessage(ev: NDKEvent): Promise<string> {
//     const authStore = useAuth()
//     if (!this._signer) {
//       throw new Error('No signer available to decrypt the message')
//     }
//     const { sender, recipient } = this.obtainParties(ev)

//     if (sender.pubkey === authStore.pubKey) {
//       // I was the sender
//       return await this._signer.decrypt(recipient, ev.content)
//     } else {
//       // I was the recipient
//       return await this._signer.decrypt(sender, ev.content)
//     }
//   }

//   /**
//    * Function used to extract the two participating parties in this communication.
//    *
//    * @param ev - The event from which to extract the parties
//    * @returns The two parties
//    */
//   obtainParties(ev: NDKEvent) : NIP04Parties {
//     if (ev.kind !== 4) {
//       throw Error('Trying to obtain parties of a non NIP-04 message')
//     }
//     const parties = ev.tags
//       .filter(([k, _v]) => k === 'p')
//     const _recipient = parties.find(([k, v]) => k === 'p' && v !== ev.author.pubkey)
//     if (!_recipient) {
//       console.error(`No recipient found in event: `, ev.rawEvent())
//       throw new Error(`No recipient found in event with id: ${ev.rawEvent().id}`)
//     }
//     const recipient = new NDKUser({
//       hexpubkey: _recipient[1]
//     })
//     return {
//       sender: ev.author,
//       recipient
//     }
//   }

//   nip44ConversationKey(privateKey: Uint8Array, publicKey: string) {
//     return nip44.v2.utils.getConversationKey(Buffer.from(privateKey), publicKey)
//   }

//   nip44Encrypt(data: EventTemplate, privateKey: Uint8Array, publicKey: string) {
//     return nip44.v2.encrypt(JSON.stringify(data), this.nip44ConversationKey(privateKey, publicKey))
//   }

//   nip44Decrypt(data: NostrEvent, privateKey: Uint8Array) {
//     return JSON.parse(nip44.v2.decrypt(data.content, this.nip44ConversationKey(privateKey, data.pubkey)))
//   }

//   now() {
//     return Math.round(Date.now() / 1000);
//   }

//   randomNow() {
//     return Math.round(this.now() - (Math.random() * GIFT_WRAP_TIME_WINDOW));
//   }

//   createRumor(event: Partial<UnsignedEvent>, privateKey: Uint8Array) : Rumor {
//     const rumor = {
//       created_at: this.now(),
//       content: "",
//       tags: [],
//       ...event,
//       pubkey: getPublicKey(privateKey),
//     } as any

//     rumor.id = getEventHash(rumor)
//     return rumor as Rumor
//   }

//   createSeal(rumor: Rumor, privateKey: Uint8Array, recipientPublicKey: string) : NostrEvent {
//     return finalizeEvent(
//       {
//         kind: NOSTR_SEAL_KIND,
//         content: this.nip44Encrypt(rumor, privateKey, recipientPublicKey),
//         created_at: this.randomNow(),
//         tags: [],
//       },
//       privateKey
//     ) as NostrEvent
//   }

//   createWrap(event: NostrEvent, recipientPublicKey: string) : NostrEvent {
//     const randomKey = generateSecretKey()
//     return finalizeEvent(
//       {
//         kind: NOSTR_GIFT_WRAP_KIND,
//         content: this.nip44Encrypt(event, randomKey, recipientPublicKey),
//         created_at: this.randomNow(),
//         tags: [["p", recipientPublicKey]],
//       },
//       randomKey
//     ) as NostrEvent
//   }

//   setupSignerWatchers() {
//     const authStore = useAuth()

//     // Registering a watcher for the private key
//     watch(() => authStore.privKey, (newPrivKey: string | null) => {
//       if (newPrivKey) {
//         try {
//           this.signer = new NDKPrivateKeySigner(newPrivKey)
//         } catch (err) {
//           console.error('Error while trying to decode nsec: ', err)
//         }
//       }
//     })

//     // Registering a watcher for public key
//     watch(() => authStore.pubKey, (newPubKey: string | null | undefined) => {
//       if (newPubKey) {
//         this.subscribeDMs(newPubKey)
//         this.subscribeGiftWraps(newPubKey)
//       } else {
//         this.unsubscribeDMs()
//       }
//     })
//   }

//   async submitDirectMessage(message: string, destinationPubkey: string): Promise<void> {
//     if (!this._signer) {
//       console.error('❗ No signer found')
//       return
//     }
//     const authStore = useAuth()
//     const myPubkey = authStore.pubKey
//     if (!myPubkey) {
//       console.error('❗ No pubkey found')
//       return
//     }
//     const event = new NDKEvent(this.ndk)
//     event.kind = NOSTR_TEXT_KIND
//     event.created_at = Math.floor(Date.now() / 1000)
//     event.content = message
//     event.pubkey = myPubkey
//     await this.signAndPublishEvent(event, destinationPubkey)
//   }

//   async signAndPublishEvent(event: NDKEvent, destination: string): Promise<void> {
//     if (this._signer instanceof NDKPrivateKeySigner) {
//       if (!this._signer.privateKey) {
//         console.error('❗ No private key found')
//         return
//       }
//       const privateKeyBuffer = Buffer.from(this._signer.privateKey, 'hex')
//       const rumor = this.createRumor(event.rawEvent(), privateKeyBuffer)
//       const seal = this.createSeal(rumor, privateKeyBuffer, destination)
//       const giftWrappedEvent = this.createWrap(seal, destination)
//       await this.publishEvent(new NDKEvent(this.ndk, giftWrappedEvent))
//     } else {
//       throw new Error('NDKNip07Signer is no longer supported. Please use NDKPrivateKeySigner.')
//     }
//   }

//   async createAndPublishMostroEvent(payload: object, mostroPubKey: string): Promise<void> {
//     const cleartext = JSON.stringify(payload)
//     const authStore = useAuth()
//     const myPubKey = authStore.pubKey
//     if (!myPubKey) {
//       console.error(`No pubkey found`)
//       return
//     }
//     const event = new NDKEvent(this.ndk)
//     event.kind = NOSTR_ENCRYPTED_DM_KIND
//     event.created_at = Math.floor(Date.now() / 1000)
//     event.content = cleartext
//     event.pubkey = myPubKey
//     event.tags = [['p', mostroPubKey]]
//     console.info('> [🎁][me -> 🧌]: ', cleartext)
//     await this.signAndPublishEvent(event, mostroPubKey)
//   }
// }

// const printRelayStats = (ndk: NDK) => {
//   const poolStats = ndk.pool.stats()
//   const outboxPoolStats = ndk.outboxPool?.stats()
//   console.log(
//     `📊 stats | pool: [connected: ${poolStats.connected}, disconnected: ${poolStats.disconnected}, connecting: ${poolStats.connecting}]` +
//     ` outboxPool: [connected: ${outboxPoolStats?.connected}, disconnected: ${outboxPoolStats?.disconnected}, connecting: ${outboxPoolStats?.connecting}]`
//   )
// }

export default defineNuxtPlugin((nuxtApp) => {
//   const nostr = new Nostr()
//   const relaysStatus = useRelays()
//   nostr.ndk.pool.on('relay:connect', (r: NDKRelay) => {
//     // console.log('>> relay:connect, ', r.url)
//     relaysStatus.updateRelayStatus(r.url, 'yellow')
//   })
//   nostr.ndk.pool.on('relay:ready', (r: NDKRelay) => {
//     // console.info('>> relay:ready, ', r.url)
//     relaysStatus.updateRelayStatus(r.url, 'green')
//   })
//   nostr.ndk.pool.on('relay:disconnect', (r: NDKRelay) => {
//     console.warn('>> relay:disconnect, ', r.url, ', relay: ', r)
//     relaysStatus.updateRelayStatus(r.url, 'red')
//     if (!nostr.mustKeepRelays.has(r.url)) {
//       console.log('🗑️ removing relay: ', r.url)
//       nostr.ndk.pool.removeRelay(r.url)
//       nostr.ndk.outboxPool?.removeRelay(r.url)
//       relaysStatus.removeRelay(r.url)
//     } else {
//       console.log('🔌 reconnecting relay: ', r.url)
//       nostr.ndk.pool.addRelay(r, true)
//       nostr.ndk.outboxPool?.addRelay(r, true)
//       printRelayStats(nostr.ndk)
//     }
//   })
//   nostr.ndk.pool.on('flapping', (r: NDKRelay) => {
//     console.warn('>> relay:flapping, ', r.url)
//     relaysStatus.updateRelayStatus(r.url, 'orange')
//   })
//   nostr.ndk.pool.on('notice', (r: any, err: any) => {
//     console.info('>> notice, ', r.url)
//     relaysStatus.updateRelayStatus(r.url, 'blue')
//   })
//   nostr.setupSignerWatchers()
//   nuxtApp.provide('nostr', nostr)
})