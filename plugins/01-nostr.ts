import NDK, { NDKKind, NDKSubscription, NDKEvent, NDKRelay, type NDKUserProfile, NDKUser, NDKRelayList } from '@nostr-dev-kit/ndk'
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie'
import { nip19 } from 'nostr-tools'
import { useRelays } from '~/stores/relays'

/**
 * Maximum number of seconds to be returned in the initial query
 */
const EVENT_INTEREST_WINDOW = 60 * 60 * 24 * 14 // 14 days

interface GetUserParams {
  npub?: string
  pubkey?: string
}

// Message kinds
type ExtendedNDKKind = NDKKind | 38383
export const NOSTR_REPLACEABLE_EVENT_KIND: ExtendedNDKKind = 38383
export const NOSTR_ENCRYPTED_DM_KIND = NDKKind.EncryptedDirectMessage

export type OrderCallback = (event: NDKEvent) => void
export type DMCallback = (event: NDKEvent) => void

export class Nostr {
  private static ndkInstance: NDK
  private users = new Map<string, NDKUser>()
  private orderSubscription: NDKSubscription | undefined
  private dmSubscription: NDKSubscription | undefined
  private orderCallback: OrderCallback | undefined
  private dmCallback: DMCallback | undefined
  public mustKeepRelays: Set<string> = new Set()
  constructor() {
    const config = useRuntimeConfig()
    const { public: { relays } } = config

    // Instantiating the dexie adapter
    const dexieAdapter = new NDKCacheAdapterDexie({ dbName: 'mostro-events' })
    Nostr.ndkInstance = new NDK({
      enableOutboxModel: true,
      cacheAdapter: dexieAdapter,
      autoConnectUserRelays: true,
    })
    for (const relay of relays.split(',')) {
      Nostr.ndkInstance.pool.addRelay(new NDKRelay(relay), true)
    }
    this.ndk.connect(2000)
  }
  
  get ndk(): NDK {
    return Nostr.ndkInstance
  }

  addUser(user: NDKUser) {
    if (!this.users.has(user.pubkey)) {
      this.users.set(user.pubkey, user)
      NDKRelayList.forUser(user.pubkey, this.ndk).then((relayList: NDKRelayList | undefined) => {
        if (relayList) {
          console.log(`🌐 Relay list for [${user.pubkey}]: `, relayList.tags.map(r => r[1]), `, from event: ${relayList.id} - [${relayList.created_at}]`)
          for (const relayUrl of relayList.relays) {
            this.mustKeepRelays.add(relayUrl)
            const ndkRelay = new NDKRelay(relayUrl)
            this.ndk.pool.addRelay(ndkRelay, true)
            this.ndk.outboxPool?.addRelay(ndkRelay, true)
          }
        }
      })
    }
  }

  getUser(pubkey: string): NDKUser | undefined {
    return this.users.get(pubkey)
  }

  setOrderCallback(callback: OrderCallback) {
    this.orderCallback = callback
  }

  setDMCallback(callback: DMCallback) {
    this.dmCallback = callback
  }

  private _handlePublicEvent(event: NDKEvent, relay: NDKRelay, subscription: NDKSubscription) {
    if (this.orderCallback) {
      this.orderCallback(event)
    } else {
      console.warn('🚨 No order callback set')
    }
  }

  private handleDupPublicEvent(
    event: NDKEvent,
    _relay: NDKRelay,
    _timeSinceFirstSeen: number,
    _subscription: NDKSubscription
  ) {
    console.debug(`🧑‍🤝‍🧑 duplicate public event [${event.id}]`)
  }

  private _handleCloseOrderSubscription(subscription: NDKSubscription) {
    console.warn('🔚 order subscription closed: ', subscription)
    this.orderSubscription = undefined
  }

  private _handlePrivateEvent(event: NDKEvent) {
    if (this.dmCallback) {
      this.dmCallback(event)
    } else {
      console.warn('🚨 No DM callback set')
    }
  }

  private _handleDupPrivateEvent(
    event: NDKEvent,
    _relay: NDKRelay,
    _timeSinceFirstSeen: number,
    _subscription: NDKSubscription
  ) {
    console.debug(`🧑‍🤝‍🧑 duplicate private event [${event.id}]`)
  }

  private _handleClosePrivateEvent(subscription: NDKSubscription) {
    console.warn('🔚 DM subscription closed: ', subscription)
  }

  subscribeOrders() {
    console.log('📣 subscribing to orders')
    const config = useRuntimeConfig()
    const mostroNpub = config.public.mostroPubKey
    const mostroDecoded = nip19.decode(mostroNpub)
    const filters = {
      kinds: [NOSTR_REPLACEABLE_EVENT_KIND as NDKKind],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
      authors: [mostroDecoded.data as string]
    }
    if (!this.orderSubscription) {
      this.orderSubscription = this.ndk.subscribe(filters)
      this.orderSubscription.on('event', this._handlePublicEvent.bind(this))
      this.orderSubscription.on('event:dup', this.handleDupPublicEvent.bind(this))
      this.orderSubscription.on('close', this._handleCloseOrderSubscription.bind(this))
    } else {
      console.error('❌ Attempting to subcribe to orders when already subscribed')
    }
  }

  subscribeDMs(myPubkey: string) {
    console.log('📭 subscribing to DMs')
    const filters = {
      kinds: [NOSTR_ENCRYPTED_DM_KIND],
      '#p': [myPubkey],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
    }
    if (!this.dmSubscription) {
      this.dmSubscription = this.ndk.subscribe(filters)
      this.dmSubscription.on('event', this._handlePrivateEvent.bind(this))
      this.dmSubscription.on('event:dup', this._handleDupPrivateEvent.bind(this))
      this.dmSubscription.on('close', this._handleClosePrivateEvent.bind(this))
    } else {
      console.error('❌ Attempting to subcribe to DMs when already subscribed')
    }
  }

  unsubscribeDMs() {
    console.log('🚫 unsubscribing to DMs')
    if (this.dmSubscription) {
      this.dmSubscription.stop()
      this.dmSubscription = undefined
    }
  }

  async publishEvent(event: NDKEvent) {
    try {
      const poolSize = this.ndk.pool.size()
      const relays = await event.publish()
      console.log(`📡 Event published to [${relays.size}/${poolSize}] relays`)
    } catch (err) {
      console.error('Error publishing event: ', err)
    }
  }

  async fetchProfile(params: GetUserParams) : Promise<NDKUserProfile | null> {
    const user = this.ndk.getUser(params)
    if (!user) return null
    return await user.fetchProfile()
  }
}

const printRelayStats = (ndk: NDK) => {
  const poolStats = ndk.pool.stats()
  const outboxPoolStats = ndk.outboxPool?.stats()
  console.log(
    `📊 stats | pool: [connected: ${poolStats.connected}, disconnected: ${poolStats.disconnected}, connecting: ${poolStats.connecting}]` +
    ` outboxPool: [connected: ${outboxPoolStats?.connected}, disconnected: ${outboxPoolStats?.disconnected}, connecting: ${outboxPoolStats?.connecting}]`
  )
}

export default defineNuxtPlugin((nuxtApp) => {
  const nostr = new Nostr()
  const relaysStatus = useRelays()
  nostr.ndk.pool.on('relay:connect', (r: NDKRelay) => {
    // console.log('>> relay:connect, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'yellow')
  })
  nostr.ndk.pool.on('relay:ready', (r: NDKRelay) => {
    // console.info('>> relay:ready, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'green')
  })
  nostr.ndk.pool.on('relay:disconnect', (r: NDKRelay) => {
    console.warn('>> relay:disconnect, ', r.url, ', relay: ', r)
    relaysStatus.updateRelayStatus(r.url, 'red')
    if (!nostr.mustKeepRelays.has(r.url)) {
      console.log('🗑️ removing relay: ', r.url)
      nostr.ndk.pool.removeRelay(r.url)
      nostr.ndk.outboxPool?.removeRelay(r.url)
      relaysStatus.removeRelay(r.url)
    } else {
      console.log('🔌 reconnecting relay: ', r.url)
      nostr.ndk.pool.addRelay(r, true)
      nostr.ndk.outboxPool?.addRelay(r, true)
      printRelayStats(nostr.ndk)
    }
  })
  nostr.ndk.pool.on('flapping', (r: NDKRelay) => {
    console.warn('>> relay:flapping, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'orange')
  })
  nostr.ndk.pool.on('notice', (r: any, err: any) => {
    console.info('>> notice, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'blue')
  })
  nuxtApp.provide('nostr', nostr)
})

