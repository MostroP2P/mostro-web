import 'bigint-polyfill'
import { RelayPool }  from 'nostr'

type MostroOptions = {
  pubKey: string,
  relays: string[]
}

class Mostro {
  pool: any
  mostro: string
  constructor(opts: MostroOptions) {
    this.pool = RelayPool(opts.relays)
    this.mostro = opts.pubKey
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
      console.log('ev: ', ev)
      const { content, kind } = ev
      if (kind === 30000) {
        // Order
        const payload = JSON.parse(content)
      } else if (kind === 4) {
        // DM
      }
    })
  }
}

export default ( context: any, inject: Function) => {
  const opts = {
    relays: context.env.RELAYS.split(','),
    pubKey: context.env.MOSTRO_PUB_KEY
  }
  const mostro = new Mostro(opts)
  inject('mostro', mostro)
}