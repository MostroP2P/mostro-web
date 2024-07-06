import { watch } from 'vue'
import { NDKEvent, type NDKSigner, NDKUser, NDKPrivateKeySigner, NDKNip07Signer } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { AuthMethod, useAuth } from '@/stores/auth'
import { useOrders } from '@/stores/orders'
import { useMessages } from '@/stores/messages'
import { Action, Order, OrderStatus, OrderType } from '../stores/types'
import { NOSTR_ENCRYPTED_DM_KIND, type Nostr } from './01-nostr'
import { useMostroStore, type MostroInfo } from '@/stores/mostro'

export type MostroEvent = NDKEvent

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

interface NIP04Parties {
  sender: NDKUser
  recipient: NDKUser
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
  mostroStore = useMostroStore()

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
    this.nostr.addUser(new NDKUser({ npub: this.mostro }))
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

  extractOrderFromEvent(ev: NDKEvent): Order {
    let id: string | undefined
    let kind: OrderType | null = null
    let status: OrderStatus | null = null
    let fiat_code: string | undefined = undefined
    let fiat_amount = 0
    let min_amount: number | null = null
    let max_amount: number | null = null
    let payment_method = ''
    let premium: number | undefined = undefined
    let amount = 0
    ev.tags.forEach((tag: string[]) => {
      switch(tag[0]) {
        case 'd':
          id = tag[1] as string
          break
        case 'k':
          kind = tag[1] as OrderType
          break
        case 'f':
          fiat_code = tag[1] as string
          break
        case 's':
          status = tag[1] as OrderStatus
          break
        case 'amt':
          amount = Number(tag[1])
          break
        case 'fa':
          fiat_amount = Number(tag[1])
          min_amount = tag[2] ? Number(tag[1]) : null
          max_amount = tag[2] ? Number(tag[2]) : null
          break
        case 'pm':
          payment_method = tag[1] as string
          break
        case 'premium':
          premium = Number(tag[1])
          break
      }
    })

    if (!id || !kind || !status || !payment_method || premium === undefined || !fiat_code) {
      console.error('Missing required tags in event to extract order. ev.tags: ', ev.tags)
      throw Error('Missing required tags in event to extract order')
    }
    if (fiat_amount === 0 && !min_amount && !max_amount) {
      console.error('Malformed order, either "fiat_amount" or "min_amount" & "max_amount" must be set. ev.tags: ', ev.tags)
      throw Error('Missing required tags in event to extract order')
    }

    const created_at = ev.created_at || 0
    const mostro_id = ev.author.pubkey

    return new Order(
      id,
      kind,
      status,
      fiat_code,
      min_amount,
      max_amount,
      fiat_amount,
      payment_method,
      premium,
      created_at,
      amount,
      mostro_id
    )
  }

  extractInfoFromEvent(ev: NDKEvent): MostroInfo {
    const tags = new Map<string, string>(ev.tags as [string, string][])
    const mostro_pubkey = tags.get('mostro_pubkey') as string
    const mostro_version = tags.get('mostro_version') as string
    const mostro_commit_id = tags.get('mostro_commit_id') as string
    const max_order_amount = Number(tags.get('max_order_amount') as string)
    const min_order_amount = Number(tags.get('min_order_amount') as string)
    const expiration_hours = Number(tags.get('expiration_hours') as string)
    const expiration_seconds = Number(tags.get('expiration_seconds') as string)
    const fee = Number(tags.get('fee') as string)
    const hold_invoice_expiration_window = Number(tags.get('hold_invoice_expiration_window') as string)
    const invoice_expiration_window = Number(tags.get('invoice_expiration_window') as string)
    return {
      mostro_pubkey,
      mostro_version,
      mostro_commit_id,
      max_order_amount,
      min_order_amount,
      expiration_hours,
      expiration_seconds,
      fee,
      hold_invoice_expiration_window,
      invoice_expiration_window
    }
  }

  async handlePublicEvent(ev: NDKEvent) {
    const nEvent = await ev.toNostrEvent()
    // Create a map from the tags array for easy access
    const tags = new Map<string, string | number[]>(ev.tags as [string, string | number[]][])

    const z = tags.get('z')
    if (z === 'order') {
      // Order
      const order = this.extractOrderFromEvent(ev)
      console.info('< [🧌 -> 📢]', JSON.stringify(order), ', ev: ', nEvent)
      if (this.orderMap.has(order.id)) {
        // Updates existing order
        this.orderStore.updateOrder({ order: order, event: ev as MostroEvent }, true)
      } else {
        // Adds new order
        this.orderStore.addOrder({ order: order, event: ev as MostroEvent })
        this.orderMap.set(order.id, ev.id)
      }
    } else if (z === 'info') {
      // Info
      const info = this.extractInfoFromEvent(ev)
      this.mostroStore.addMostroInfo(info)
      console.info('< [🧌 -> 📢]', JSON.stringify(info), ', ev: ', nEvent)
    } else {
      // TODO: Extract other kinds of events data: Disputes & Ratings
    }
  }

  /**
   * Function used to extract the two participating parties in this communication.
   *
   * @param ev - The event from which to extract the parties
   * @returns The two parties
   */
  private obtainParties(ev: NDKEvent) : NIP04Parties {
    if (ev.kind !== 4) {
      throw Error('Trying to obtain parties of a non NIP-04 message')
    }
    const parties = ev.tags
      .filter(([k, _v]) => k === 'p')
    const _recipient = parties.find(([k, v]) => k === 'p' && v !== ev.author.pubkey)
    if (!_recipient) {
      console.error(`No recipient found in event: `, ev.rawEvent())
      throw new Error(`No recipient found in event with id: ${ev.rawEvent().id}`)
    }
    const recipient = new NDKUser({
      hexpubkey: _recipient[1]
    })
    return {
      sender: ev.author,
      recipient
    }
  }

  async handlePrivateEvent(ev: NDKEvent) {
    if (!this.signer) {
      console.error('❗ No signer found, cannot decrypt DM')
      return
    }
    const myPubKey = this.pubkeyCache.hex
    const nEvent = await ev.toNostrEvent()
    const mostroPubKey = nip19.decode(this.mostro).data
    const { sender, recipient } = this.obtainParties(ev)
    if (sender.pubkey === myPubKey) {
      // DMs I created
      try {
        const [[, recipientPubKey]] = ev.tags
        const recipientUser = new NDKUser({
          hexpubkey: recipientPubKey
        })
        const plaintext = await this.signer.decrypt(recipientUser, ev.content)
        if (recipientPubKey === mostroPubKey)
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
    } else if (recipient.pubkey === myPubKey) {
      // DMs I received
      try {
        const sender = new NDKUser({
          hexpubkey: ev.pubkey
        })
        const plaintext = await this.signer.decrypt(sender, ev.content)
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
    } else {
      console.warn(`<< Ignoring DM for key: ${recipient.pubkey}, my pubkey is ${myPubKey}`)
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
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: Action.NewOrder,
        content: {
          order: order
        }
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async takeSell(order: Order, amount?: number | undefined) {
    const payload = {
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        id: order.id,
        action: Action.TakeSell,
        content: amount ? {
            amount: amount
          } : null
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async takeBuy(order: Order, amount?: number | undefined) {
    const payload = {
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        id: order.id,
        action: Action.TakeBuy,
        content: amount ? {
          amount: amount
        } : null
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async addInvoice(order: Order, invoice: string, amount: number | null = null) {
    const payload = {
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        id: order.id,
        action: Action.AddInvoice,
        content: {
          payment_request: [
            null,
            invoice,
            amount
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
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: Action.Release,
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
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: Action.FiatSent,
        id: order.id
      }
    }
    const event = await this.createEvent(payload)
    if (event) {
      await event.sign(this.signer)
      await this.nostr.publishEvent(event)
    }
  }
  async rateUser(order: Order, rating: number) {
    const payload = {
      order: {
        version: 1,
        id: order.id,
        pubkey: null,
        action: Action.RateUser,
        content: {
          rating_user: rating
        }
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
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: Action.Dispute,
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
      order: {
        version: 1,
        pubkey: this.getLocalKeys().hex,
        action: Action.Cancel,
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
  async submitDirectMessage(message: string, npub: string, replyTo: string | undefined): Promise<void> {
    if (!this.signer) {
      console.error('❗ No signer found')
      return
    }
    if (!this?.pubkeyCache?.hex) {
      console.error('❗ No pubkey found')
      return
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
    await this.nostr.publishEvent(event)
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

  // Registering a watcher for the private key
  const authStore = useAuth()
  watch(() => authStore.privKey, (newPrivKey: string | null) => {
    if (newPrivKey) {
      try {
        mostro.signer = new NDKPrivateKeySigner(newPrivKey)
      } catch (err) {
        console.error('Error while trying to decode nsec: ', err)
      }
    }
  })

  // Registering a watcher for public key
  watch(() => authStore.pubKey, (newPubKey: string | null | undefined) => {
    // Updated the pubkey cache
    mostro.pubkeyCache = {
      hex: newPubKey ? newPubKey : null,
      npub: newPubKey ? nip19.npubEncode(newPubKey) : null
    }
    if (authStore.authMethod === AuthMethod.NIP07) {
      if (newPubKey) {
        mostro.signer = new NDKNip07Signer()
      }
    }
    if (newPubKey) {
      nostr.subscribeDMs(newPubKey)
    } else {
      nostr.unsubscribeDMs()
    }
  })
})