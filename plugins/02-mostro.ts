import { watch } from 'vue'
import { NDKEvent, type NDKSigner, NDKUser, NDKPrivateKeySigner, NDKNip07Signer } from '@nostr-dev-kit/ndk'
import { nip19, type Event } from 'nostr-tools'
import { useAuth } from '@/stores/auth'
import { useOrders } from '@/stores/orders'
import { useMessages } from '@/stores/messages'
import { Order, OrderStatus, OrderType } from '../stores/types'
import type { Nostr } from './01-nostr'

/**
 * Maximum number of seconds to be returned in the initial query
 */
const EVENT_INTEREST_WINDOW = 60 * 60 * 24 * 7 // 7 days

// Message kinds
const NOSTR_REPLACEABLE_EVENT_KIND = 38383
const NOSTR_ENCRYPTED_DM_KIND = 4

export type MostroEvent = Event<typeof NOSTR_REPLACEABLE_EVENT_KIND | typeof NOSTR_ENCRYPTED_DM_KIND>

type MostroOptions = {
  mostroPubKey: string,
  nostr: Nostr
}

type PublicKeyCache = {
  npub: null | string,
  hex: null | string
}

export enum PublicKeyType {
  HEX = 'hex',
  NPUB = 'npub'
}

export class Mostro {
  _signer: NDKSigner | undefined
  mostro: string
  nostr: Nostr
  orderMap: Map<string, string> // Maps order id -> event id
  orders_sub_id: string
  dm_sub_id: string
  pubkeyCache: PublicKeyCache = { npub: null, hex: null }
  orderStore: ReturnType<typeof useOrders>
  messageStore: ReturnType<typeof useMessages>

  constructor(opts: MostroOptions) {
    this.mostro = opts.mostroPubKey
    this.orderMap = new Map<string, string>
    this.orders_sub_id = this.generateRandomSubId()
    this.dm_sub_id = this.generateRandomSubId()
    this.orderStore = useOrders()
    this.messageStore = useMessages()
    this.nostr = opts.nostr
    this.nostr.setOrderCallback(this.handlePublicEvent.bind(this))
    this.nostr.setDMCallback(this.handlePrivateEvent.bind(this))
    this.nostr.subscribeOrders()
  }

  public set signer(signer: NDKSigner | undefined) {
    this._signer = signer
    if (this._signer) {
      this._signer.user()
        .then((user: NDKUser) => {
          this.pubkeyCache = {
            hex: user.pubkey,
            npub: user.npub
          }
        })
        .catch(err => console.error('Error while getting public key from signer. err: ', err))
    }
  }

  public get signer() : NDKSigner | undefined {
    return this._signer
  }


  private generateRandomSubId() {
    const RANDOM_CHAR_COUNT = 15
    // This will generate a subscription id of the form `mostro-xxx...xxx`
    return 'mostro-'+[...Array(RANDOM_CHAR_COUNT)]
      .map(() => Math.random().toString(36)[2]).join('')
  }

  extractOrderFromEvent(tags: Map<string, string>, ev: NDKEvent): Order {
    if (!tags.has('d') || !tags.has('k') || !tags.has('s') || !tags.has('fa') || !tags.has('pm') || !tags.has('premium') || !tags.has('f')) {
      console.error('Missing required tags in event to extract order. ev.tags: ', ev.tags)
      throw Error('Missing required tags in event to extract order')
    }

    // Extract values from the tags map
    const id = tags.get('d') as string
    const kind = tags.get('k') as OrderType
    const status = tags.get('s') as OrderStatus
    const fiat_code = tags.get('f') as string
    const fiat_amount = Number(tags.get('fa'))
    const amount = Number(tags.get('amt'))
    const payment_method = tags.get('pm') as string
    const premium = Number(tags.get('premium'))
    const created_at = ev.created_at || 0

    return new Order(id, kind, status, fiat_code, fiat_amount, payment_method, premium, created_at, amount)
  }

  async handlePublicEvent(ev: NDKEvent) {
    const nEvent = await ev.toNostrEvent()
    // Create a map from the tags array for easy access
    const tags = new Map<string, string>(ev.tags as [string, string][])
    if (tags.get('z') === 'order') {
      // Order
      const order = this.extractOrderFromEvent(tags, ev)
      console.info('< [🧌 -> 📢]', JSON.stringify(order), ', ev: ', nEvent)
      if (this.orderMap.has(order.id)) {
        // Updates existing order
        this.orderStore.updateOrder({ order: order, event: ev as MostroEvent }, true)
      } else {
        // Adds new order
        this.orderStore.addOrder({ order: order, event: ev as MostroEvent })
        this.orderMap.set(order.id, ev.id)
      }
    } else {
      // TODO: Extract other kinds of events data: Disputes & Ratings
    }
  }

  async handlePrivateEvent(ev: NDKEvent) {
    const nEvent = await ev.toNostrEvent()
    const tags = new Map<string, string>(ev.tags as [string, string][])
    if (tags.has('p')) {
      const recipient = tags.get('p') as string
      const mostroPubKey = nip19.decode(this.mostro).data
      const myPubKey = this.pubkeyCache.hex
      if (myPubKey === recipient) {
        try {
          const sender = new NDKUser({
            hexpubkey: ev.pubkey
          })
          const plaintext = await this.signer!.decrypt!(sender, ev.content)
          if (ev.pubkey === mostroPubKey) {
            console.info('< [🧌 -> me]: ', plaintext, ', ev: ', nEvent)
            const msg = { ...JSON.parse(plaintext), created_at: ev.created_at }
            this.messageStore.addMostroMessage({ message: msg, event: ev as MostroEvent})
          } else {
            console.info('< [🍐 -> me]: ', plaintext, ', ev: ', nEvent)
            // Peer DMs
            const peerNpub = nip19.npubEncode(ev.pubkey)
            this.messageStore.addPeerMessage({
              id: ev.id,
              text: plaintext,
              peerNpub: peerNpub,
              sender: 'other',
              created_at: ev.created_at || 0
            })
          }
        } catch (err) {
          console.error('Error while trying to decode DM: ', err)
        }
      } else if (ev.pubkey === myPubKey) {
        // DMs I created
        try {
          const [[, recipientPubKey]] = ev.tags
          const recipient = new NDKUser({
            hexpubkey: recipientPubKey
          })
          const plaintext = await this.signer!.decrypt!(recipient, ev.content)
          if (recipient === mostroPubKey)
            console.log('< [me -> 🧌]: ', plaintext, ', ev: ', nEvent)
          else
            console.log('< [me -> 🍐]: ', plaintext, ', ev: ', nEvent)
          const peerNpub = nip19.npubEncode(recipientPubKey)
          this.messageStore.addPeerMessage({
            id: ev.id,
            text: plaintext,
            peerNpub: peerNpub,
            sender: 'me',
            created_at: ev.created_at || 0
          })
        } catch (err) {
          console.error('Error while decrypting message: ', err)
        }
      } else {
        console.log(`> DM. ev: `, ev)
        console.warn(`Ignoring _DM for key: ${recipient}, my pubkey is ${myPubKey}`)
      }
    } else {
      console.warn('Ignoring DM with no recipient')
    }
  }

  async createEvent(payload: object): Promise<NDKEvent | null> {
    if (!this.signer) {
      console.error('❗ No signer found')
      return null
    }
    const mostroPubKey = nip19.decode(this.mostro).data as string
    const mostro = new NDKUser({ hexpubkey: mostroPubKey })
    const cleartext = JSON.stringify(payload)
    const ciphertext = await this.signer.encrypt(mostro, cleartext)
    const myPubKey = this.pubkeyCache.hex
    if (!myPubKey) {
      console.error(`No pubkey found`)
      return null
    }
    const event = new NDKEvent(this.nostr.ndk)
    event.kind = NOSTR_ENCRYPTED_DM_KIND
    event.created_at = Math.floor(Date.now() / 1000)
    event.content = ciphertext
    event.pubkey = myPubKey
    event.tags = [['p', mostroPubKey]]
    const nEvent = await event.toNostrEvent()
    console.info('> [me -> 🧌]: ', cleartext, ', ev: ', nEvent)
    return event
  }

  getLocalKeys() {
    return {
      npub: this.pubkeyCache.npub,
      hex: this.pubkeyCache.hex
    }
  }

  async submitOrder(order: Order) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: 'NewOrder',
        content: {
          Order: order
        }
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async takeSell(order: Order, invoice: string) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        id: order.id,
        action: 'TakeSell',
        content: invoice === null ? null : {
          PaymentRequest: [
            null,
            invoice
          ]
        }
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async takeBuy(order: Order) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        id: order.id,
        action: 'TakeBuy',
        content: {
          Peer: {
            pubkey: this.getLocalKeys().hex
          }
        }
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async addInvoice(order: Order, invoice: string) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        id: order.id,
        action: 'AddInvoice',
        content: {
          PaymentRequest: [
            null,
            invoice
          ]
        }
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async release(order: Order) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: 'Release',
        id: order.id,
        content: null,
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async fiatSent(order: Order) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: 'FiatSent',
        id: order.id
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async dispute(order: Order) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: 'Dispute',
        id: order.id,
        content: null,
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async cancel(order: Order) {
    const payload = {
      Order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: 'Cancel',
        id: order.id,
        content: null,
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async submitDirectMessage(message: string, npub: string, replyTo: string): Promise<NDKEvent | null> {
    if (!this.signer) {
      console.error('❗ No signer found')
      return null
    }
    if (!this?.pubkeyCache?.hex) {
      console.error('❗ No pubkey found')
      return null 
    }
    const myPubkey = this.pubkeyCache.hex
    const destinationPubKey = nip19.decode(npub).data as string
    const recipient = new NDKUser({ hexpubkey: destinationPubKey })
    const ciphertext = await this.signer.encrypt(recipient, message)
    const event = new NDKEvent(this.nostr.ndk)
    event.kind = NOSTR_ENCRYPTED_DM_KIND
    event.created_at = Math.floor(Date.now() / 1000)
    event.content = ciphertext
    event.pubkey = myPubkey
    event.tags = [
      ['p', destinationPubKey],
      ['p', myPubkey]
    ]
    if (replyTo) {
      event.tags.push(['e', replyTo, '', 'reply'])
    }
    await event.sign(this.signer)
    return event
  }

  getNpub() {
    return this.pubkeyCache.npub
  }

  getUserPublicKey() {
    return this.pubkeyCache
  }

  getMostroPublicKey(type: PublicKeyType) {
    switch (type) {
      case PublicKeyType.HEX:
        return nip19.decode(this.mostro).data
      case PublicKeyType.NPUB:
        return this.mostro
      default:
        return this.mostro
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const nostr = nuxtApp.$nostr as Nostr
  const config = useRuntimeConfig()
  const { public: { mostroPubKey } } = config
  const opts: MostroOptions = {
    nostr,
    mostroPubKey
  }
  const mostro = new Mostro(opts)
  nuxtApp.provide('mostro', mostro)

  // Registering a watcher for the nsec
  const authStore = useAuth()
  watch(() => authStore.nsec, (newValue) => {
    if (newValue) {
      // If we have a signer, we can request DMs
      mostro.signer = new NDKPrivateKeySigner(newValue)
      const myPubkey = newValue
      // mostro.subscribeDMs()
      nostr.subscribeDMs(myPubkey)
    } else {
      // mostro.lock()
      nostr.unsubscribeDMs()
    }
  })

  // Registering a watcher for public key
  watch(() => authStore.publicKey, (newValue) => {
    if (newValue) {
      mostro.pubkeyCache = {
        hex: newValue,
        npub: nip19.npubEncode(newValue)
      }
      mostro.signer = new NDKNip07Signer()
      const myPubkey = newValue
      nostr.subscribeDMs(myPubkey)
    } else {
      // mostro.lock()
      nostr.unsubscribeDMs()
    }
  })
})