import { watch } from 'vue'
import { RelayPool } from 'nostr'
import { nip19, getEventHash, verifySignature, UnsignedEvent, Kind, Relay, Event } from 'nostr-tools'
import { useAuth } from '@/stores/auth'
import { useOrders } from '@/stores/orders'
import { useMessages } from '@/stores/messages'
import { Order, SmallOrder } from '../stores/types'
import { BaseSigner, ExtensionSigner, LocalSigner } from './01-signer'

/**
 * Maximum number of events to be returned in the initial query
 */
const EVENT_LIMIT = 100

/**
 * Maximum number of seconds to be returned in the initial query
 */
const EVENT_INTEREST_WINDOW = 60 * 60 * 24 * 7 // 7 days

type MostroOptions = {
  mostroPubKey: string,
  relays: string[]
}

type PublicKeyCache = {
  npub: null | string,
  hex: null | string
}

class Mostro {
  _signer: BaseSigner | undefined
  pool: any
  mostro: string
  relays: string[]
  orderMap: Map<string, string> // Maps order id -> event id
  orders_sub_id: string
  dm_sub_id: string
  pubkeyCache: PublicKeyCache = { npub: null, hex: null }
  orderStore: ReturnType<typeof useOrders>
  messageStore: ReturnType<typeof useMessages>

  // Maps id to boolean, true if we've already handled the event
  eventMap: Map<string, boolean> = new Map<string, boolean>()

  constructor(opts: MostroOptions) {
    this.relays = opts.relays
    this.mostro = opts.mostroPubKey
    this.orderMap = new Map<string, string>
    this.orders_sub_id = this.generateRandomSubId()
    this.dm_sub_id = this.generateRandomSubId()
    this.orderStore = useOrders()
    this.messageStore = useMessages()
  }

  public set signer(signer: BaseSigner | undefined) {
    this._signer = signer
    if (this._signer) {
      this._signer.getPublicKey()
        .then((publicKey: string) => {
          const npub = nip19.npubEncode(publicKey)
          this.pubkeyCache = {
            hex: publicKey,
            npub
          }
        })
        .catch(err => console.error('Error while getting public key from signer. err: ', err))
    }
  }

  public get signer() : BaseSigner | undefined {
    return this._signer
  }

  lock() {
    if (this.signer instanceof LocalSigner) {
      this.signer.locked = true
    }
  }

  close() {
    // We'll issue unsubscribe notices to all relays and close the
    // connection CONNECTION_CLOSE_TIMEOUT milliseconds later.
    const CONNECTION_CLOSE_TIMEOUT =  800
    this.pool.unsubscribe(this.dm_sub_id)
    this.pool.unsubscribe(this.orders_sub_id)
    setTimeout(() => this.pool.close(), CONNECTION_CLOSE_TIMEOUT)
  }

  private generateRandomSubId() {
    const RANDOM_CHAR_COUNT = 15
    // This will generate a subscription id of the form `mostro-xxx...xxx`
    return 'mostro-'+[...Array(RANDOM_CHAR_COUNT)]
      .map(() => Math.random().toString(36)[2]).join('')
  }

  subscribeOrders() {
    console.log('📣 subscribing to orders')
    const mostroPubKey = nip19.decode(this.mostro).data
    const filters = {
      limit: EVENT_LIMIT,
      kinds: [30000],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
      authors: [mostroPubKey]
    }
    this.pool.subscribe(this.orders_sub_id, filters)
  }

  subscribeDMs() {
    console.log('📭 subscribing to DMs')
    const filters = {
      limit: EVENT_LIMIT,
      kinds: [4],
      '#p': [this.pubkeyCache.hex],
      since: Math.floor(Date.now() / 1e3) - EVENT_INTEREST_WINDOW,
    }
    this.pool.subscribe(this.dm_sub_id, filters)
  }

  unsubscribeDMs() {
    this.pool.unsubscribe(this.dm_sub_id)
  }

  handleReconnection() {
    if (this.signer instanceof LocalSigner) {
      // In case of local signer, we only subscribe to DMs if the signer is unlocked
      if (!this.signer.locked) {
        this.subscribeDMs()
      }
    } else {
      // ExtensionSigner
      this.subscribeDMs()
    }
  }

  init() {
    this.pool = RelayPool(this.relays)
    this.pool.on('open', (relay: any) => {
      console.info('🌟 relay opened: ', relay)
      // We always subscribe to orders
      this.subscribeOrders()
      if (this.signer) {
        // If we have a signer already assigned, it probably means this is
        // a reconnection event, in which case we need to resubscribe to DMs
        console.debug('🔄 probably a reconnection')
        this.handleReconnection()
      }
    })
    this.pool.on('close', (relay: Relay) => {
      console.warn('💀 relay closed: ', relay)
    })
    this.pool.on('ok', async (relay: Relay, id: string, accepted: boolean, msg: string) => {
      // TODO: Do more with this
      console.debug(`👍 got an ok event. id: ${id}, accepted: ${accepted}, msg: ${msg}`)
    })
    this.pool.on('event', async (relay: Relay, sub_id: string, ev: Event) => {
      const hasValidSignature = verifySignature(ev)
      if (!hasValidSignature) {
        // Discarding event with invalid signature
        console.warn(`🗑️ dropping event due to invalid signature. id: ${ev.id}, sig: ${ev.sig}`)
        return
      }
      if (this.eventMap.has(ev.id)) {
        // We've already handled this event
        // console.debug('< 🦜 repeated event: ', ev.id)
        return
      }
      this.eventMap.set(ev.id, true)
      await this.handleEvent(ev)
    })
  }

  async handleEvent(ev: any) {
    let { kind } = ev
    if (!this.signer && kind !== 30000) {
      // We shouldn't have any events other than kind 30000 at this point, but just in case
      console.warn('dropping event due to lack of signer')
      return
    }
    if (kind === 30000) {
      // Order
      let { content } = ev
      // Most of the orders that we receive via kind events are not ours,
      // so we set the `is_mine` field as false here.
      content = { ...JSON.parse(content), is_mine: false }
      console.log('< 📢', content)
      if (this.orderMap.has(content.id)) {
        // Updates existing order
        this.orderStore.updateOrder({ order: content, event: ev })
      } else {
        // Adds new order
        this.orderStore.addOrder({ order: content, event: ev })
        this.orderMap.set(content.id, ev.id)
      }
    } else if (kind === 4) {
      // @ts-ignore
      let recipient = ev.tags.find(([k, v]) => k === 'p' && v && v !== '')[1]
      const mostroPubKey = nip19.decode(this.mostro).data
      const myPubKey = this.pubkeyCache.hex
      if (myPubKey === recipient) {
        try {
          const plaintext = await this.signer!.decrypt!(ev.pubkey, ev.content)
          if (ev.pubkey === mostroPubKey) {
            console.info('< 💬 [🧌 -> me]: ', plaintext, ', ev: ', ev)
            const msg = { ...JSON.parse(plaintext), created_at: ev.created_at }
            this.messageStore.addMostroMessage({ message: msg, event: ev })
          } else {
            console.info('< 💬 [peer -> me]: ', plaintext, ', ev: ', ev)
            // Peer DMs
            const peerNpub = nip19.npubEncode(ev.pubkey)
            this.messageStore.addPeerMessage({
              id: ev.id,
              text: plaintext,
              peerNpub: peerNpub,
              sender: 'other',
              created_at: ev.created_at
            })
          }
        } catch (err) {
          console.error('Error while trying to decode DM: ', err)
        }
      } else if (ev.pubkey === myPubKey) {
        // DMs I created
        if (recipient !== mostroPubKey) {
          // This is a DM I created for a conversation with another peer
          try {
            const [[, recipientPubKey]] = ev.tags
            const plaintext = await this.signer!.decrypt!(recipientPubKey, ev.content)
            console.log('< 💬 [me -> 🧌]: ', plaintext, ', ev: ', ev)
            const peerNpub = nip19.npubEncode(recipient)
            this.messageStore.addPeerMessage({
              id: ev.id,
              text: plaintext,
              peerNpub: peerNpub,
              sender: 'me',
              created_at: ev.created_at
            })
          } catch (err) {
            console.error('Error while decrypting message: ', err)
          }
        } else if (recipient === mostroPubKey) {
          // DM I sent to mostro
          console.debug('< 💬 [me -> 🧌]: ', ev)
        } else {
          // DM I sent to someone else
          console.debug('< 💬 [me -> ?], ev: ', ev)
        }
      } else {
        console.log(`> DM. ev: `, ev)
        console.warn(`Ignoring _DM for key: ${recipient}, my pubkey is ${myPubKey}`)
      }
    } else {
      console.info(`Got event with kind: ${kind}, ev: `, ev)
    }
  }

  async createEvent(payload: object) {
    const publicKey = nip19.decode(this.mostro).data as string
    const ciphertext = await this.signer!.encrypt!(publicKey, JSON.stringify(payload))
    const myPubKey = this.pubkeyCache.hex
    let event = {
      id: undefined as undefined | string,
      sig: undefined,
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: ciphertext,
      pubkey: myPubKey,
      tags: [ ['p', publicKey] ]
    }
    event.id = getEventHash(event as UnsignedEvent<Kind.EncryptedDirectMessage>)
    event = await this.signer?.signEvent(event)
    console.log('> 📝 createEvent. payload: ', payload, ', ev: ', event)
    return ['EVENT', event]
  }

  getLocalKeys() {
    return {
      npub: this.pubkeyCache.npub,
      public: this.pubkeyCache.hex
    }
  }

  async submitOrder(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      action: 'Order',
      content: {
        Order: order
      }
    }
    const event = await this.createEvent(payload)
    await this.pool.send(event)
  }
  async takeSell(order: Order, invoice: string) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      order_id: order.id,
      action: 'TakeSell',
      content: invoice === null ? null : {
        PaymentRequest: [
          null,
          invoice
        ]
      }
    }
    const event = await this.createEvent(payload)
    await this.pool.send(event)
  }
  async takeBuy(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      order_id: order.id,
      action: 'TakeBuy',
      content: {
        Peer: {
          pubkey: this.getLocalKeys().npub
        }
      }
    }
    const event = await this.createEvent(payload)
    await this.pool.send(event)
  }
  async addInvoice(order: SmallOrder, invoice: string) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      order_id: order.id,
      action: 'AddInvoice',
      content: {
        PaymentRequest: [
          null,
          invoice
        ]
      }
    }
    const event = await this.createEvent(payload)
    await this.pool.send(event)
  }
  async release(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      action: 'Release',
      order_id: order.id
    }
    const event = await this.createEvent(payload)
    await this.pool.send(event)
  }
  async fiatSent(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      action: 'FiatSent',
      order_id: order.id
    }
    const event = await this.createEvent(payload)
    await this.pool.send(event)
  }
  async submitDirectMessage(message: string, npub: string, replyTo: string) {
    const destinationPubKey = nip19.decode(npub).data as string
    const myPublicKey = await this.signer?.getPublicKey()
    const ciphertext = await this.signer?.encrypt!(destinationPubKey, message)
    let event = {
      id: undefined as undefined | string,
      sig: undefined as undefined | string,
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: ciphertext,
      pubkey: myPublicKey,
      tags: [
        ['p', destinationPubKey],
      ]
    }
    if (replyTo) {
      event.tags.push(['e', replyTo, '', 'reply'])
    }
    event.id = getEventHash(event as UnsignedEvent<Kind.EncryptedDirectMessage>)
    event = await this.signer?.signEvent(event)
    await this.pool.send(['EVENT', event])
  }

  getNpub() {
    return this.pubkeyCache.npub
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const { public: { relays, mostroPubKey } } = config
  const opts: MostroOptions = {
    relays: relays.split(','),
    mostroPubKey
  }
  const mostro = new Mostro(opts)
  nuxtApp.provide('mostro', mostro)
  // We need to wait a bit before initializing the mostro object, otherwise the
  // client & server-side rendering versions won't match for some reason.
  setTimeout(() => mostro.init(), 1e3)

  // Registering a watcher for the nsec
  const authStore = useAuth()
  watch(() => authStore.nsec, (newValue) => {
    if (newValue) {
      // If we have a signer, we can request DMs
      mostro.signer = new LocalSigner()
      mostro.subscribeDMs()
    } else {
      mostro.lock()
      mostro.unsubscribeDMs()
    }
  })

  // Registering a watcher for public key
  watch(() => authStore.publicKey, (newValue) => {
    if (newValue) {
      mostro.pubkeyCache = {
        hex: newValue,
        npub: nip19.npubEncode(newValue)
      }
      mostro.signer = new ExtensionSigner()
      mostro.subscribeDMs()
    } else {
      mostro.lock()
      mostro.unsubscribeDMs()
    }
  })
})