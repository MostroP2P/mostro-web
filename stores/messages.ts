import {
  ThreadSummary,
  MostroMessage,
  PeerMessage,
  PeerThreadSummary,
  Order,
  Action
} from './types'
import { useOrders } from './orders'

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
      { message, eventId } : { message: MostroMessage, eventId: string }
    ) {
      const orderStore = useOrders()
      if (message?.content?.SmallOrder) {
        // If we have a SmallOrder as payload we might be receiving the buyer's identity
        // so here we expand our order data with it.
        const { content } = message
        if (content.SmallOrder) {
          const { seller_pubkey, buyer_pubkey } = content.SmallOrder
          const order = await orderStore.getOrderById(message.order_id) as Order
          if (seller_pubkey && buyer_pubkey) {
            order.seller_pubkey = seller_pubkey
            order.buyer_pubkey = buyer_pubkey
            if (order) {
              orderStore.updateOrder({ order, eventId })
            } else {
              orderStore.scheduleOrderUpdate({
                orderId: message.order_id,
                seller_pubkey,
                buyer_pubkey,
                eventId
              })
            }
          }
        }
      }
      if (message?.action === Action.Order) {
        const order: Order = message.content.Order as Order
        orderStore.addUserOrder({ order, eventId })
      }
      this.messages.mostro.splice(0, 0, message)
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
        if (!messageMap.has(message.order_id)) {
          messageMap.set(message.order_id, 1)
        } else {
          let currentCount = messageMap.get(message.order_id) as number
          messageMap.set(message.order_id, currentCount + 1)
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
    getMostroMessagesByOrderId(state: MessagesState ) : (orderId: string) => MostroMessage[] {
      return (orderId: string) => {
        const messageSlice = state.messages.mostro.slice(0)
        return messageSlice
          .filter((message: MostroMessage) => message.order_id === orderId)
          .sort((a: MostroMessage, b: MostroMessage) => a.created_at - b.created_at)
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