import 'bigint-polyfill'
import { RelayPool }  from 'nostr'

type MostroOptions = {
  pubKey: string,
  relays: string[]
  store: any
}

class Mostro {
  pool: any
  mostro: string
  store: any
  constructor(opts: MostroOptions) {
    this.pool = RelayPool(opts.relays)
    this.mostro = opts.pubKey
    this.store = opts.store
    this.init()
  }

  init() {
    this.pool.on('open', (relay: any) => {
      const { nip19 } = window.NostrTools
      const { mostroPubKey } = nip19.decode(this.mostro)
      relay.subscribe('subid', {limit: 100, kinds:[4, 30000], authors: [mostroPubKey]})
    })
    this.pool.on('close', (relay: any) => {
      relay.close()
    })
    this.pool.on('event', (relay: any, sub_id: any, ev: any) => {
      const { content, kind } = ev
      if (kind === 30000) {
        // Order
        this.store.dispatch('orders/addOrder', JSON.parse(content))
      } else if (kind === 4) {
        // DM
      }
    })
  }
}

export default ( { env, store }: any, inject: Function) => {
  const opts = {
    relays: env.RELAYS.split(','),
    pubKey: env.MOSTRO_PUB_KEY,
    store: store
  }
  const mostro = new Mostro(opts)
  inject('mostro', mostro)
}