import NDK, { NDKKind, NDKSubscription, NDKEvent, NDKRelay, type NDKUserProfile } from '@nostr-dev-kit/ndk'
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
  private orderSubscription: NDKSubscription | undefined
  private dmSubscription: NDKSubscription | undefined
  private orderCallback: OrderCallback | undefined
  private dmCallback: DMCallback | undefined
  constructor() {
    const dexieAdapter = new NDKCacheAdapterDexie({ dbName: 'mostro-events' })
    Nostr.ndkInstance = new NDK({ cacheAdapter: dexieAdapter })
  }
  
  get ndk(): NDK {
    return Nostr.ndkInstance
  }

  connect() {
    this.ndk.connect()
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
    relay: NDKRelay,
    timeSinceFirstSeen: number,
    subscription: NDKSubscription
  ) {
    console.debug('🧑‍🤝‍🧑 duplicate public event. time: ', timeSinceFirstSeen)
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
    relay: NDKRelay,
    timeSinceFirstSeen: number,
    subscription: NDKSubscription
  ) {
    console.debug('🧑‍🤝‍🧑 duplicate private event. time: ', timeSinceFirstSeen)
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

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const { public: { relays } } = config
  const nostr = new Nostr()
  for (const relay of relays.split(',')) {
    nostr.ndk.addExplicitRelay(relay)
  }
  const relaysStatus = useRelays()
  nostr.ndk.pool.on('relay:connect', (r: NDKRelay) => {
    console.log('>> relay:connect, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'yellow')
  })
  nostr.ndk.pool.on('relay:ready', (r: NDKRelay) => {
    console.info('>> relay:ready, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'green')
  })
  nostr.ndk.pool.on('relay:disconnect', (r: NDKRelay) => {
    console.warn('>> relay:disconnect, ', r.url)
    relaysStatus.updateRelayStatus(r.url, 'red')
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

