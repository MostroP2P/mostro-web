import {
  ThreadSummary,
  MostroMessage,
  PeerMessage,
  PeerThreadSummary,
  Order,
  Action
} from './types'
import { useOrders } from './orders'
import { MostroEvent } from 'plugins/02-mostro'

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
    async addMostroMessage(
      { message, event } : { message: MostroMessage, event: MostroEvent }
    ) {
      if (message.Order) {
        const orderMessage = message.Order
        const orderStore = useOrders()
        if (orderMessage?.action === Action.NewOrder) {
          const order: Order = orderMessage.content.Order as Order
          orderStore.addUserOrder({ order, event })
        } else if (
          orderMessage?.action === Action.BuyerTookOrder ||
          orderMessage?.action === Action.HoldInvoicePaymentAccepted ||
          orderMessage?.action === Action.HoldInvoicePaymentSettled
        ) {
          const order: Order = orderMessage.content.Order as Order
          orderStore.updateOrder({ order, event })
        }
        this.messages.mostro.push(message)
      } else if (message.CantDo) {
        console.warn(`>>> [${message.CantDo.id}] CantDo, id: ${message.CantDo.id} message: ${message.CantDo.content.TextMessage}`)
      } else {
        console.warn('>>> addMostroMessage: message has unknown property property. ev id: ', event.id)
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
        if (!message.Order) continue
        const orderMessage = message.Order
        if (!messageMap.has(orderMessage.id)) {
          messageMap.set(orderMessage.id, 1)
        } else {
          let currentCount = messageMap.get(orderMessage.id) as number
          messageMap.set(orderMessage.id, currentCount + 1)
        }
      }
      return Array.from(messageMap).map(([orderId, messageCount]) => {
        const orderStore = useOrders()
        const order = orderStore.getOrderById(orderId)
        return { orderId, messageCount, order }
      })
      .filter((summary: ThreadSummary) => summary.order !== undefined)
      .sort((summaryA: ThreadSummary, summaryB: ThreadSummary) => summaryB.order.created_at - summaryA.order.created_at)
    },
    getPeerThreadSummaries(
      state: MessagesState,
    ) : PeerThreadSummary[] {
      const npubs = Object.keys(state.messages.peer)
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
          .filter((message: MostroMessage) => message.Order)
          .filter((message: MostroMessage) => message.Order.id === orderId)

        // Reducing messages to only the last one for each action
        type ReducerAcc = { [key: string]: MostroMessage }
        const reduced = messages.reduce<ReducerAcc>((acc: ReducerAcc, message: MostroMessage) => {
          if (!message.Order) return acc
          const orderMessage = message.Order
          if(acc[orderMessage.action] && acc[orderMessage.action].Order.created_at < orderMessage.created_at) {
            acc[orderMessage.action] = message
          } else if (!acc[orderMessage.action]) {
            acc[orderMessage.action] = message
          }
          return acc
        }, {})

        if (!reduced) return []
        // Converting back to an array
        return Object.values(reduced)
      }
    },
    getPeerMessagesByNpub(state: MessagesState) : (npub: string) => PeerMessage[] {
      return (npub: string) => {
        if (state.messages.peer[npub]) {
          const messages = [...state.messages.peer[npub]]
          return messages
            .sort((a: PeerMessage, b: PeerMessage) => a.created_at - b.created_at)
        }
        return []
      }
    }
  }
})