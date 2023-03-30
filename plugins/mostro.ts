import 'bigint-polyfill'
import { RelayPool }  from 'nostr'
import { Order } from '../store/orders'

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
      const { nip19 } = window.NostrTools
      const mostroPubKey = nip19.decode(this.mostro)
      relay.subscribe('subid', {limit: 100, kinds:[4, 30000], authors: [mostroPubKey.data]})
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
        console.log(`> order update. sub_id: ${sub_id}, ev: `, ev)
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
        console.log(`> DM. sub_id: ${sub_id}, ev: `, ev)
        // @ts-ignore
        let recipient = ev.tags.find(([k, v]) => k === 'p' && v && v !== '')[1]
        const { nip04, nip19, getPublicKey } = window.NostrTools
        const secretKey = nip19.decode(this.secretKey).data
        const pubKey = getPublicKey(secretKey)
        if (pubKey === recipient) {
          try {
            const plaintext = await nip04.decrypt(secretKey, ev.pubkey, ev.content)
            console.log('> plaintext: ', plaintext)
            // TODO: Add to store
          } catch(err) {
            console.error('Error while trying to decode DM: ', err)
          }
        } else {
          console.warn(`Ignoring DM for key: ${recipient}, my pubkey is ${pubKey}`)
        }
      }
    })
  }

  async createEvent(payload: object) {
    const { nip04, nip19, getPublicKey, getEventHash, signEvent } = window.NostrTools
    const secretKey = nip19.decode(this.secretKey).data
    const publicKey = nip19.decode(this.mostro).data
    const ciphertext = await nip04.encrypt(secretKey, publicKey, JSON.stringify(payload))
    let event = {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: ciphertext,
      pubkey: getPublicKey(secretKey),
      tags: [ ['p', publicKey] ]
    }
    // @ts-ignore
    event.id = getEventHash(event)
    // @ts-ignore
    event.sig = signEvent(event, secretKey)
    return event
  }

  async submitOrder(order: Order) {
    const payload = {
      version: 0,
      action: 'Order',
      content: {
        Order: {
          kind: order.kind,
          status: order.status,
          amount: order.amount,
          fiat_code: order.fiat_code,
          fiat_amount: order.fiat_amount,
          payment_method: order.payment_method,
          prime: order.prime
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