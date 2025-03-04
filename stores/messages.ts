import type {
  ThreadSummary,
  ChatMessage,
  PeerThreadSummary,
} from './types'
import {
  OrderStatus
} from './types'
import { useOrders } from './orders'
import { useAlertStore } from './alerts'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { webln } from '@getalby/sdk'
import { Action, type MostroMessage, type Order } from '~/utils/mostro/types'
import type { Mostro } from '~/utils/mostro'
import type { GiftWrap, Rumor, Seal } from '~/utils/nostr/types'
import { nip19 } from 'nostr-tools'
import { KeyManager } from '~/utils/key-manager'
import Dexie from 'dexie'

interface ProcessedInvoice {
  id?: number
  invoice: string
  orderId: string
  processedAt: number
  paymentResponse?: string // Store payment response as JSON string
}

class ProcessedInvoicesDatabase extends Dexie {
  processedInvoices!: Dexie.Table<ProcessedInvoice, number>

  constructor() {
    super('mostro-processed-invoices-db')
    this.version(1).stores({
      processedInvoices: '++id, invoice, orderId, processedAt'
    })
  }
}

const processedInvoicesDb = new ProcessedInvoicesDatabase()

export interface MessagesState {
  messages: {
    mostro: MostroMessage[],
    peer: {
      [key: string]: ChatMessage[]
    }
  }
}

// Minimum expected response time in seconds. This is used to display alerts in a timely manner
// and ignore past messages.
const MIN_EXPECTED_RESPONSE_TIME = 60

const keyManager = new KeyManager()

const payInvoice = async (invoice: string) => {
  const authStore = useAuth()
  if (!authStore.nwcPassword) {
    throw new Error('NWC password not available')
  }
  if (!authStore.encryptedNwc) {
    throw new Error('NWC not available')
  }
  const { decrypt } = useCrypto()
  const nostrWalletConnectUrl = await decrypt(authStore.encryptedNwc, authStore.nwcPassword)
  if (!nostrWalletConnectUrl) {
    throw new Error('NWC URL not available')
  }
  const nwc = new webln.NWC({ nostrWalletConnectUrl })
  await nwc.enable()
  const response = await nwc.sendPayment(invoice)
  return response
}

const hasNwc = () => {
  const authStore = useAuth()
  return authStore.nwcPassword && authStore.encryptedNwc
}

const pendingPayments = new Map<string, Promise<PaymentResponse>>()

const onPaymentResolved = (invoice: string, response: PaymentResponse) => {
  console.log('Payment resolved, response: ', response)
  pendingPayments.delete(invoice)
}

/**
 * Handles the payment of an invoice using NWC.
 *
 * @param invoice - The invoice to pay.
 * @param orderId - The id of the order to update.
 */
const handleNwcPayment = async (invoice: string, orderId: string) => {
  const orderStore = useOrders()
  if (invoice && orderId) {
    // Check if invoice was already processed
    const processedInvoice = await processedInvoicesDb.processedInvoices
      .where('invoice')
      .equals(invoice)
      .first()

    if (processedInvoice) {
      // If the invoice was processed and payment was successful, update order status
      if (processedInvoice.paymentResponse) {
        orderStore.updateOrderStatus(orderId, OrderStatus.ACTIVE)
      }
      return
    }

    const pendingPayment = payInvoice(invoice)
    const alertStore = useAlertStore()
    pendingPayment
      .then(async (response) => {
        onPaymentResolved(invoice, response)
        // Store the processed invoice
        await processedInvoicesDb.processedInvoices.add({
          invoice,
          orderId,
          processedAt: Math.floor(Date.now() / 1000),
          paymentResponse: JSON.stringify(response)
        })
      })
      .catch(async (error) => {
        // Store the failed attempt
        await processedInvoicesDb.processedInvoices.add({
          invoice,
          orderId,
          processedAt: Math.floor(Date.now() / 1000),
          paymentResponse: undefined
        })
        alertStore.addAlert(
          'warning',
          `Automatic payment for order ${orderId} failed. Message: ${error.message}. Please pay manually.`
        )
      })

    pendingPayments.set(invoice, pendingPayment)
    // If the payment is not resolved in 2 seconds, we assume it reached mostro and its being held
    await new Promise(resolve => setTimeout(resolve, 2_000))
    if (pendingPayments.has(invoice)) {
      orderStore.updateOrderStatus(orderId, OrderStatus.ACTIVE)
      alertStore.addAlert(
        'success',
        `Automatic payment for order ${orderId} succeeded`
      )
    }
  }
}

export const useMessages = defineStore('messages', {
  state: () => ({
    messages: {
      mostro: [] as MostroMessage[],
      peer: {} as Record<string, ChatMessage[]>,
    }
  }),
  actions: {
    nuxtClientInit() {
      const mostro = useNuxtApp().$mostro as Mostro
      mostro.on('mostro-message', this.addMostroMessage)
      mostro.on('peer-message', this.addPeerMessage)
    },
    async addMostroMessage(
      message: MostroMessage,
      event: NDKEvent
    ) {
      if (message.order) {
        const orderMessage = message.order
        const orderStore = useOrders()
        const disputeStore = useDisputes()
        if (orderMessage?.action === Action.PayInvoice) {
          if (hasNwc()) {
            const invoice = message.order?.payload?.payment_request?.[1] as string
            const orderId = message.order?.id
            if (invoice && orderId) {
              handleNwcPayment(invoice, orderId)
            } else {
              console.warn('>>> [NWC] PayInvoice: invoice or orderId is undefined')
            }
          }
        }
        if (orderMessage?.action === Action.NewOrder) {
          const order: Order = orderMessage.payload?.order as Order
          orderStore.addUserOrder({ order, event })
        } else if (
          orderMessage?.action === Action.BuyerTookOrder ||
          orderMessage?.action === Action.HoldInvoicePaymentAccepted ||
          orderMessage?.action === Action.HoldInvoicePaymentSettled
        ) {
          const order: Order = orderMessage?.payload?.order as Order
          if (order)
            orderStore.updateOrder({ order, event })
        } else if (orderMessage?.action === Action.RateReceived) {
          const rating = orderMessage?.payload?.rating_user
          const order: Order = orderStore.getOrderById(orderMessage.id as string) as Order
          if (order && rating) {
            orderStore.updateOrderRating({ order, rating, confirmed: true })
          }
        } else if (
          orderMessage?.action === Action.DisputeInitiatedByYou ||
          orderMessage?.action === Action.DisputeInitiatedByPeer
        ) {
          console.log('>>> Dispute initiated for order: ', message.order.id)
          const order: Order = orderStore.getOrderById(orderMessage.id as string) as Order
          if (order) {
            if (!message?.order?.payload?.dispute) {
              console.warn('>>> addMostroMessage: message has no dispute property. message: ', message)
              return
            }
            orderStore.markDisputed(order, event)
            const dispute: Dispute = {
              id: message.order.payload?.dispute as string,
              orderId: order.id,
              createdAt: message.created_at || 0,
              status: DisputeStatus.INITIATED
            }
            disputeStore.addDispute(dispute)
          }
        } else if (orderMessage?.action === Action.AdminTookDispute) {
          disputeStore.updateDisputeStatus(orderMessage.id as string, DisputeStatus.IN_PROGRESS)
        } else if (orderMessage?.action === Action.AdminSettled) {
          disputeStore.updateDisputeStatus(orderMessage.id as string, DisputeStatus.SETTLED)
        } else if (orderMessage?.action === Action.AdminCanceled) {
          disputeStore.updateDisputeStatus(orderMessage.id as string, DisputeStatus.CANCELED)
        } else if (orderMessage?.action === Action.OutOfRangeSatsAmount) {
          this.handleOutOfRangeSatsAmount(message)
        }
        orderStore.onOrderAction(message.order.id as string, orderMessage.action as Action, event)
        this.messages.mostro.push(message)
      } else if (message['cant-do']) {
        console.warn(`>>> [${message['cant-do'].id}] CantDo, id: ${message['cant-do'].id} message: ${message['cant-do']?.content?.text_message}`)
      } else {
        console.warn('>>> addMostroMessage: message has unknown property property. message: ', message, ', ev: ', event)
      }
    },
    async addPeerMessage(gift: GiftWrap, seal: Seal, rumor: Rumor) {
      // Check if the seal pubkey is recorded as one of my trade keys
      const isMessageMine = await keyManager.isTradeKey(seal.pubkey)
      // If the message is mine, the peer's pubkey will be placed at the external gift wrap layer.
      // Otherwise, it will be placed at the middle seal layer.
      const peerHex = isMessageMine ? gift.pubkey : seal.pubkey
      if (peerHex !== undefined) {
        const peerNpub = nip19.npubEncode(peerHex)
        let sender: 'me' | 'other' = 'other'
        if (isMessageMine) {
          sender = 'me'
          console.info('< [me -> 🍐]: ', rumor.content)
        } else {
          console.info('< [🍐 -> me]: ', rumor.content)
        }

        const chatMessage: ChatMessage = {
          id: rumor.id,
          peerNpub,
          text: rumor.content,
          created_at: rumor.created_at,
          sender
        }

        if (!this.messages.peer[peerNpub]) {
          this.messages.peer[peerNpub] = []
        }
        this.messages.peer[peerNpub].push(chatMessage)
      } else {
        console.warn('Unexpected situation in addPeerMessage: peerHex is undefined')
      }
    },
    handleOutOfRangeSatsAmount(message: MostroMessage) {
      const now = Date.now() / 1e3
      const createdAt = new Date(message.created_at || 0)
      const diff = now - createdAt.getTime()
      if (diff < MIN_EXPECTED_RESPONSE_TIME) {
        const alertStore = useAlertStore()
        alertStore.addAlert(
          'error',
          `The order you just attempted to create has an amount that is too large. Please try again with a smaller amount.`
        )
      }
    }
  },
  getters: {
    getMostroThreadSummaries(state): ThreadSummary[] {
      // Map from order-id -> message count
      const messageMap = new Map<string, number>()
      // Loop that fills the map
      for (const message of state.messages.mostro) {
        if (!message.order) continue
        const orderMessage = message.order
        if (!messageMap.has(orderMessage.id as string)) {
          messageMap.set(orderMessage.id as string, 1)
        } else {
          let currentCount = messageMap.get(orderMessage.id as string) as number
          messageMap.set(orderMessage.id as string, currentCount + 1)
        }
      }
      return Array.from(messageMap).map(([orderId, messageCount]) => {
        const orderStore = useOrders()
        const order = orderStore.getOrderById(orderId) as Order
        return { orderId, messageCount, order }
      })
      .filter((summary: ThreadSummary) => summary.order !== undefined)
      .filter((summary: ThreadSummary) => summary.order.status !== OrderStatus.PENDING)
      .filter((summary: ThreadSummary) => summary.order.status !== OrderStatus.CANCELED)
      .filter((summary: ThreadSummary) => summary.order.status !== OrderStatus.EXPIRED)
      .sort((summaryA: ThreadSummary, summaryB: ThreadSummary) => summaryB.order.created_at - summaryA.order.created_at)
    },
    getPeerThreadSummaries(
      state: MessagesState,
    ) : PeerThreadSummary[] {
      const config = useRuntimeConfig()
      const { public: { mostroPubKey } } = config
      // We remove mostro's public key from here as we don't want to
      // show the users all the NIP-04 messages we've been exchanging with mostro
      const npubs = Object.keys(state.messages.peer)
        .filter((npub: string) => npub !== mostroPubKey)
      return npubs.map((npub: string) => {
        const peerMessages = this.getPeerMessagesByNpub(npub)
        const lastMessage = peerMessages[peerMessages.length - 1]
        return {
          peer: npub,
          messageCount: peerMessages.length,
          lastMessage
        }
      })
    },
    /**
     * This function will return a list of mostro messages for a given order id
     *
     * It starts by copying all messages to a new array, that will then be
     * manipulated so that:
     *
     * - Only messages for the given order id are kept
     * - Only the last message for each action is kept
     *
     * We do this because sometimes if a trade is not finalized, mostro will
     * replay the message corresponding to previous actions.
     *
     * @param state - The message state
     * @returns A filtered list of messages, with only the last message for each action
     */
    getMostroMessagesByOrderId(state: MessagesState ) : (orderId: string) => MostroMessage[] {
      return (orderId: string) => {
        // Copying messages array
        const messageSlice = state.messages.mostro.slice(0)
        // Filtering messages by order id
        const messages = messageSlice
          .filter((message: MostroMessage) => message?.order)
          .filter((message: MostroMessage) => message?.order?.id === orderId)

        // Reducing messages to only the last one for each action
        type ReducerAcc = { [key: string]: MostroMessage }
        const reduced = messages.reduce<ReducerAcc>((acc: ReducerAcc, message: MostroMessage) => {
          if (!message.order) return acc
          const orderMessage = message.order
          if(acc[orderMessage.action] && (acc[orderMessage.action]?.order?.created_at || 0) < orderMessage.created_at) {
            acc[orderMessage.action] = message
          } else if (!acc[orderMessage.action]) {
            acc[orderMessage.action] = message
          }
          return acc
        }, {})

        if (!reduced) return []
        // Converting back to an array
        return Object.values(reduced)
          .sort((a: MostroMessage, b: MostroMessage) => (a.created_at || 0) - (b.created_at || 0))
      }
    },
    getPeerMessagesByNpub(state: MessagesState) : (npub: string) => ChatMessage[] {
      return (npub: string) => {
        if (!npub) return []
        if (state?.messages?.peer[npub]) {
          const messages = [...state.messages.peer[npub]]
          console.log(`Found ${messages.length} messages for npub ${npub}`, messages)
          return messages
            .sort((a: ChatMessage, b: ChatMessage) => a.created_at - b.created_at)
        } else {
          console.warn(`No messages found for npub ${npub}`)
          return []
        }
      }
    }
  }
})