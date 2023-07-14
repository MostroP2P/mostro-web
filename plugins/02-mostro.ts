import { watch } from 'vue'
import { RelayPool } from 'nostr'
import { nip19, getEventHash } from 'nostr-tools'
import { useAuth } from '@/stores/auth'
import { useOrders } from '@/stores/orders'
import { useMessages } from '@/stores/messages'
import { Order, SmallOrder } from '../stores/types'
import { BaseSigner, ExtensionSigner, LocalSigner } from './01-signer'

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
  sub_id: string
  pubkeyCache: PublicKeyCache = { npub: null, hex: null }
  orderStore: ReturnType<typeof useOrders>
  messageStore: ReturnType<typeof useMessages>
  constructor(opts: MostroOptions) {
    this.relays = opts.relays
    this.mostro = opts.mostroPubKey
    this.orderMap = new Map<string, string>
    this.sub_id = this.generateRandomSubId()
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
    this.pool.unsubscribe(this.sub_id)
    setTimeout(() => this.pool.close(), CONNECTION_CLOSE_TIMEOUT)
  }

  private generateRandomSubId() {
    const RANDOM_CHAR_COUNT = 15
    // This will generate a subscription id of the form `mostro-xxx...xxx`
    return 'mostro-'+[...Array(RANDOM_CHAR_COUNT)]
      .map(() => Math.random().toString(36)[2]).join('')
  }

  public subscribe(kinds: number[]) {
    this.pool.subscribe(this.sub_id, {limit: 100, kinds})
  }

  init() {
    this.pool = RelayPool(this.relays)
    this.pool.on('open', (relay: any) => {
      this.subscribe([30000])
    })
    this.pool.on('close', (relay: any) => {
      relay.close()
    })
    this.pool.on('event', async (relay: any, sub_id: any, ev: any) => {
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
        content = {...JSON.parse(content), is_mine: false}
        console.log(`< Mostro 30000. sub_id: ${sub_id}, ev: `, ev)
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
              console.log('< Mostro DM: ', plaintext, ', ev: ', ev)
              const msg = { ...JSON.parse(plaintext), created_at: ev.created_at }
              this.messageStore.addMostroMessage({ message: msg, event: ev })
            } else {
              console.log('< Peer DM: ', plaintext, ', ev: ', ev)
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
          } catch(err) {
            console.error('Error while trying to decode DM: ', err)
          }
        } else if(ev.pubkey === myPubKey) {
          console.log('< DM I created: ', ev)
          // DM I created
          if (recipient !== mostroPubKey) {
            // This is a DM I created for a conversation
            try {
              const [[, recipientPubKey]] = ev.tags
              const plaintext = await this.signer!.decrypt!(recipientPubKey, ev.content)
              const peerNpub = nip19.npubEncode(recipient)
              this.messageStore.addPeerMessage({
                id: ev.id,
                text: plaintext,
                peerNpub: peerNpub,
                sender: 'me',
                created_at: ev.created_at
              })
            } catch(err) {
              console.error('Error while decrypting message: ', err)
            }  
          }
        } else {
          console.log(`> DM. ev: `, ev)
          console.warn(`Ignoring _DM for key: ${recipient}, my pubkey is ${myPubKey}`)
        }
      } else {
        console.info(`Got event with kind: ${kind}, ev: `, ev)
      }
    })
  }

  async createEvent(payload: object) {
    const publicKey = nip19.decode(this.mostro).data
    const ciphertext = await this.signer!.encrypt!(publicKey, JSON.stringify(payload))
    const myPubKey = this.pubkeyCache.hex
    let event = {
      id: undefined,
      sig: undefined,
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: ciphertext,
      pubkey: myPubKey,
      tags: [ ['p', publicKey] ]
    }
    event.id = getEventHash(event)
    event = await this.signer?.signEvent(event)
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
    const destinationPubKey = nip19.decode(npub).data
    const myPublicKey = await this.signer?.getPublicKey()
    const ciphertext = await this.signer?.encrypt!(destinationPubKey, message)
    let event = {
      id: undefined,
      sig: undefined,
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
    event.id = getEventHash(event)
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
  watch(() => authStore.nsec, (newValue, oldValue) => {
    if (newValue) {
      // If we have a signer, we can request DMs
      mostro.signer = new LocalSigner()
      mostro.subscribe([30000, 4])
    } else {
      mostro.close()
      mostro.lock()
    }
  })

  // Registering a watcher for public key
  watch(() => authStore.publicKey, (newValue, oldValue) => {
    if (newValue) {
      mostro.pubkeyCache = {
        hex: newValue,
        npub: nip19.npubEncode(newValue)
      }
      mostro.signer = new ExtensionSigner()
      mostro.subscribe([30000, 4])
    } else {
      mostro.close()
      mostro.lock()
    }
  })
})