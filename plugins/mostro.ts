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
  constructor(opts: MostroOptions) {
    this.pool = RelayPool(opts.relays)
    this.mostro = opts.mostroPubKey
    this.secretKey = opts.secretKey
    this.store = opts.store
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
      const { content, kind } = ev
      if (kind === 30000) {
        // Order
        this.store.dispatch('orders/addOrder', JSON.parse(content))
      } else if (kind === 4) {
        // DM
        console.log(`> sub_id: ${sub_id}, ev: `, ev)
        // @ts-ignore
        let recipient = ev.tags.find(([k, v]) => k === 'p' && v && v !== '')[1]
        const { nip04, nip19, getPublicKey } = window.NostrTools
        const secretKey = nip19.decode(this.secretKey).data
        const pubKey = getPublicKey(secretKey)
        if (pubKey === recipient) {
          try {
            const plaintext = await nip04.decrypt(secretKey, pubKey, ev.content)
            // TODO: Add to store
          } catch(err) {
            console.error('Error while trying to decode DM: ', err)
          }
        } else {
          console.warn(`Ignoring DM for key: ${pubKey}`)
        }
      }
    })
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