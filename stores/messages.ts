import type {
  ThreadSummary,
  PeerMessage,
  PeerThreadSummary,
} from './types'
import {
  Action,
  OrderStatus
} from './types'
import { useOrders } from './orders'
// import { useAlertStore } from './alerts'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import type { MostroMessage, Order } from '~/utils/mostro/types'
import type { Mostro } from '~/utils/mostro'

export interface MessagesState {
  messages: {
    mostro: MostroMessage[],
    peer: {
      [key: string]: PeerMessage[]
    }
  }
}

export const useMessages = defineStore('messages', {
  state: () => ({
    messages: {
      mostro: [] as MostroMessage[],
      peer: {}
    }
  }),
  actions: {
    nuxtClientInit() {
      const mostro = useNuxtApp().$mostro as Mostro
      mostro.on('mostro-message', this.addMostroMessage)
    },
    async addMostroMessage(
      message: MostroMessage,
      event: NDKEvent
    ) {
      if (message.order) {
        const orderMessage = message.order
        const orderStore = useOrders()
        const disputeStore = useDisputes()
        if (orderMessage?.action === Action.NewOrder) {
          const order: Order = orderMessage.content.order as Order
          orderStore.addUserOrder({ order, event })
        } else if (
          orderMessage?.action === Action.BuyerTookOrder ||
          orderMessage?.action === Action.HoldInvoicePaymentAccepted ||
          orderMessage?.action === Action.HoldInvoicePaymentSettled
        ) {
          const order: Order = orderMessage?.content?.order as Order
          if (order)
            orderStore.updateOrder({ order, event })
        } else if (orderMessage?.action === Action.RateReceived) {
          const rating = orderMessage?.content?.rating_user
          const order: Order = orderStore.getOrderById(orderMessage.id) as Order
          if (order && rating) {
            orderStore.updateOrderRating({ order, rating, confirmed: true })
          }
        } else if (
          orderMessage?.action === Action.DisputeInitiatedByYou ||
          orderMessage?.action === Action.DisputeInitiatedByPeer
        ) {
          console.log('>>> Dispute initiated for order: ', message.order.id)
          const order: Order = orderStore.getOrderById(orderMessage.id) as Order
          if (order) {
            if (!message?.order?.content?.dispute) {
              console.warn('>>> addMostroMessage: message has no dispute property. message: ', message)
              return
            }
            orderStore.markDisputed(order, event)
            const dispute: Dispute = {
              id: message.order.content.dispute as string,
              orderId: order.id,
              createdAt: message.created_at,
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
        }
        orderStore.updateOrderStatus(message.order.id, orderMessage.action as Action, event)
        this.messages.mostro.push(message)
      } else if (message['cant-do']) {
        console.warn(`>>> [${message['cant-do'].id}] CantDo, id: ${message['cant-do'].id} message: ${message['cant-do']?.content?.text_message}`)
      } else {
        console.warn('>>> addMostroMessage: message has unknown property property. message: ', message, ', ev: ', event)
      }
    },
    addPeerMessage(peerMessage: PeerMessage) {
      const { peerNpub } = peerMessage
      const updatedMessages = Object.assign({}, this.messages) as MessagesState['messages']
      const existingMessages = updatedMessages.peer[peerNpub] ?? []
      updatedMessages.peer[peerNpub] = [...existingMessages, peerMessage]
      this.messages = updatedMessages
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
        if (!messageMap.has(orderMessage.id)) {
          messageMap.set(orderMessage.id, 1)
        } else {
          let currentCount = messageMap.get(orderMessage.id) as number
          messageMap.set(orderMessage.id, currentCount + 1)
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
          .filter((message: MostroMessage) => message.order)
          .filter((message: MostroMessage) => message.order.id === orderId)

        // Reducing messages to only the last one for each action
        type ReducerAcc = { [key: string]: MostroMessage }
        const reduced = messages.reduce<ReducerAcc>((acc: ReducerAcc, message: MostroMessage) => {
          if (!message.order) return acc
          const orderMessage = message.order
          if(acc[orderMessage.action] && acc[orderMessage.action].order.created_at < orderMessage.created_at) {
            acc[orderMessage.action] = message
          } else if (!acc[orderMessage.action]) {
            acc[orderMessage.action] = message
          }
          return acc
        }, {})

        if (!reduced) return []
        // Converting back to an array
        return Object.values(reduced)
          .sort((a: MostroMessage, b: MostroMessage) => a.created_at - b.created_at)
      }
    },
    getPeerMessagesByNpub(state: MessagesState) : (npub: string) => PeerMessage[] {
      return (npub: string) => {
        if (!npub) return []
        if (state?.messages?.peer[npub]) {
          const messages = [...state.messages.peer[npub]]
          console.log(`Found ${messages.length} messages for npub ${npub}`, messages)
          return messages
            .sort((a: PeerMessage, b: PeerMessage) => a.created_at - b.created_at)
        } else {
          console.warn(`No messages found for npub ${npub}`)
          return []
        }
      }
    }
  }
})