import 'bigint-polyfill'
import { RelayPool }  from 'nostr'
import { Order, SmallOrder } from '../store/types'

type MostroOptions = {
  mostroPubKey: string,
  secretKey: string,
  relays: string[]
  store: any
}

class Mostro {
  pool: any
  mostro: string
  secretKey: string
  store: any
  orderMap: Map<string, string> // Maps order id -> event id
  constructor(opts: MostroOptions) {
    this.pool = RelayPool(opts.relays)
    this.mostro = opts.mostroPubKey
    this.secretKey = opts.secretKey
    this.store = opts.store
    this.orderMap = new Map<string, string>
    this.init()
  }

  init() {
    this.pool.on('open', (relay: any) => {
      relay.subscribe('mostro', {limit: 100, kinds:[4, 30000]})
    })
    this.pool.on('close', (relay: any) => {
      relay.close()
    })
    this.pool.on('event', async (relay: any, sub_id: any, ev: any) => {
      let { kind } = ev
      if (kind === 30000) {
        // Order
        let { content } = ev
        content = JSON.parse(content)
        // console.log(`> order update. sub_id: ${sub_id}, ev: `, ev)
        if (this.orderMap.has(content.id)) {
          // Updates existing order
          this.store.dispatch('orders/updateOrder', content)
        } else {
          // Adds new order
          this.store.dispatch('orders/addOrder', content)
          this.orderMap.set(content.id, ev.id)
        }
      } else if (kind === 4) {
        // DM
        // console.debug(`> DM. ev: `, ev)
        // @ts-ignore
        let recipient = ev.tags.find(([k, v]) => k === 'p' && v && v !== '')[1]
        const { nip04, nip19, getPublicKey } = window.NostrTools
        const mySecretKey = nip19.decode(this.secretKey).data
        const myPubKey = getPublicKey(mySecretKey)
        const mostroPubKey = nip19.decode(this.mostro).data
        if (myPubKey === recipient) {
          try {
            const plaintext = await nip04.decrypt(mySecretKey, ev.pubkey, ev.content)
            if (ev.pubkey === mostroPubKey) {
              console.log('> Mostro DM: ', plaintext, ', ev: ', ev)
              // Mostro DMs
              // For now, some messages from mostro are just plain text. With time it
              // is expected for them all to migrate to JSON objects. But in order to
              // distinguish them at this point we're taking advantage of the fact that
              // all text messages contain the 🧌 emoji :)
              const emojiIndex = plaintext.indexOf('🧌')
              if (emojiIndex !== -1) {
                console.warn('Potential text message not handled')
              } else {
                const msg = { ...JSON.parse(plaintext), created_at: ev.created_at }
                this.store.dispatch('messages/addMostroMessage', msg)
              }
            } else {
              // Peer DMs
              const peerNpub = nip19.npubEncode(ev.pubkey)
              this.store.dispatch('messages/addPeerMessage', {
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
          // DM I created
          if (recipient !== mostroPubKey) {
            // This is a DM I created for a conversation
            try {
              const plaintext = await nip04.decrypt(mySecretKey, recipient, ev.content)
              const peerNpub = nip19.npubEncode(recipient)
              this.store.dispatch('messages/addPeerMessage', {
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
          // console.log(`> DM. ev: `, ev)
          // console.warn(`Ignoring _DM for key: ${recipient}, my pubkey is ${myPubKey}`)
        }
      } else {
        console.info(`Got event with kind: ${kind}, ev: `, ev)
      }
    })
  }

  async createEvent(payload: object) {
    const { nip04, nip19, getPublicKey, getEventHash, signEvent } = window.NostrTools
    const secretKey = nip19.decode(this.secretKey).data
    const publicKey = nip19.decode(this.mostro).data
    const ciphertext = await nip04.encrypt(secretKey, publicKey, JSON.stringify(payload))
    let event = {
      id: undefined,
      sig: undefined,
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: ciphertext,
      pubkey: getPublicKey(secretKey),
      tags: [ ['p', publicKey] ]
    }
    event.id = getEventHash(event)
    event.sig = signEvent(event, secretKey)
    return event
  }

  getLocalKeys() {
    const { nip19, getPublicKey } = window.NostrTools
    const mySecretKey = nip19.decode(this.secretKey).data
    const myPublicKey = getPublicKey(mySecretKey)
    const npub = nip19.npubEncode(myPublicKey)
    return {
      nsec: this.secretKey,
      npub: npub,
      secret: mySecretKey,
      public: myPublicKey
    }
  }

  async submitOrder(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      action: 'Order',
      content: {
        Order: {
          kind: order.kind,
          status: order.status,
          amount: order.amount,
          fiat_code: order.fiat_code,
          fiat_amount: order.fiat_amount,
          payment_method: order.payment_method,
          premium: order.premium,
          buyer_invoice: order.buyer_invoice
        }
      }
    }
    const event = await this.createEvent(payload)
    const msg = ['EVENT', event]
    await this.pool.send(msg)
  }
  async takeSell(order: Order, invoice: string) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      order_id: order.id,
      action: 'TakeSell',
      content: {
        PaymentRequest: [
          null,
          invoice
        ]
      }
    }
    const event = await this.createEvent(payload)
    const msg = ['EVENT', event]
    await this.pool.send(msg)
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
    const msg = ['EVENT', event]
    await this.pool.send(msg)
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
    const msg = ['EVENT', event]
    await this.pool.send(msg)
  }
  async release(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      action: 'Release',
      order_id: order.id
    }
    const event = await this.createEvent(payload)
    const msg = ['EVENT', event]
    await this.pool.send(msg)
  }
  async fiatSent(order: Order) {
    const payload = {
      version: 0,
      pubkey: this.getLocalKeys().npub,
      action: 'FiatSent',
      order_id: order.id
    }
    const event = await this.createEvent(payload)
    const msg = ['EVENT', event]
    await this.pool.send(msg)
  }
  async submitDirectMessage(message: string, npub: string, replyTo: string) {
    const { nip04, nip19, getPublicKey, getEventHash, signEvent } = window.NostrTools
    const destinationPubKey = nip19.decode(npub).data
    const mySecretKey = nip19.decode(this.secretKey).data
    const ciphertext = await nip04.encrypt(mySecretKey, destinationPubKey, message)
    let event = {
      id: undefined,
      sig: undefined,
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: ciphertext,
      pubkey: getPublicKey(mySecretKey),
      tags: [
        ['p', destinationPubKey],
      ]
    }
    if (replyTo) {
      event.tags.push(['e', replyTo, '', 'reply'])
    }
    event.id = getEventHash(event)
    event.sig = signEvent(event, mySecretKey)
    const msg = ['EVENT', event]
    await this.pool.send(msg)
  }

  getNpub() {
    const { getPublicKey, nip19 } = window.NostrTools
    const decodedSecretKey = nip19.decode(this.secretKey).data
    return nip19.npubEncode(getPublicKey(decodedSecretKey))
  }
}

export default ( { env, store }: any, inject: Function) => {
  const opts = {
    relays: env.RELAYS.split(','),
    mostroPubKey: env.MOSTRO_PUB_KEY,
    secretKey: env.SECRET_KEY,
    store: store
  }
  const mostro = new Mostro(opts)
  inject('mostro', mostro)
}