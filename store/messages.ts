import Vue from 'vue'

import {
  ThreadSummary,
  MostroMessage,
  PeerMessage,
  PeerThreadSummary,
  Order,
  Action
} from './types'

export interface MessagesState {
  messages: {
    mostro: MostroMessage[],
    peer: {
      [key: string]: PeerMessage[]
    }
  }
}

export const state = () => ({
  messages: {
    mostro: [] as MostroMessage[],
    peer: {}
  }
})

export const actions = {
  async addMostroMessage(context: any, message: MostroMessage) {
    const { commit, dispatch, rootGetters } = context
    if (message?.content?.SmallOrder) {
      // If we have a SmallOrder as payload we might be receiving the buyer's identity
      // so here we expand our order data with it.
      const { content } = message
      if (content.SmallOrder) {
        const { seller_pubkey, buyer_pubkey } = content.SmallOrder
        const order = await rootGetters['orders/getOrderById'](message.order_id) as Order
        if (seller_pubkey) {
          order.seller_pubkey = seller_pubkey
        }
        if (buyer_pubkey) {
          order.buyer_pubkey = buyer_pubkey
        }
        dispatch('orders/updateOrder', order, { root: true })
      }
    }
    if (message?.action === Action.Order) {
      const order: Order = message.content.Order as Order
      dispatch('orders/addUserOrder', order, { root: true })
    }
    commit('addMostroMessage', message)
  },
  addPeerMessage(context: any, peerMessage: PeerMessage) {
    const { commit } = context
    commit('addPeerMessage', peerMessage)
  }
}

export const mutations = {
  addMostroMessage(state: MessagesState, message: MostroMessage) {
    state.messages.mostro = [message, ...state.messages.mostro]
  },
  addPeerMessage(state: MessagesState, peerMessage: PeerMessage) {
    const { peerNpub } = peerMessage
    const updatedMessages = Object.assign({}, state.messages)
    const existingMessages = updatedMessages.peer[peerNpub] ?? []
    updatedMessages.peer[peerNpub] = [...existingMessages, peerMessage]
    Vue.set(state, 'messages', updatedMessages)
  }
}

export const getters = {
  getMostroThreadSummaries(
    state: MessagesState,
    getters: any,
    rootState : any
  ) : ThreadSummary[] {
    const messageMap = new Map<string, number>()
    for (const message of state.messages.mostro) {
      if (!messageMap.has(message.order_id)) {
        messageMap.set(message.order_id, 1)
      } else {
        let currentCount = messageMap.get(message.order_id) as number
        messageMap.set(message.order_id, currentCount + 1)
      }
    }
    return Array.from(messageMap).map(([orderId, messageCount]) => {
      const order = rootState.orders.orders.get(orderId)
      return { orderId, messageCount, order }
    })
    .sort((summaryA: ThreadSummary, summaryB: ThreadSummary) => summaryB.order.created_at - summaryA.order.created_at)
  },
  getPeerThreadSummaries(
    state: MessagesState,
    getters: any,
    rootState: any
  ) : PeerThreadSummary[] {
    const npubs = Object.keys(state.messages.peer)
    return npubs.map((npub: string) => {
      const peerMessages = getters.getPeerMessagesByNpub(npub)
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
  getPeerMessagesByNpub(state: MessagesState) {
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