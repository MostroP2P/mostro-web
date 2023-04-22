import Vue from 'vue'

import {
  Action,
  ThreadSummary,
  MostroMessage,
  TextMessage,
  PeerMessage,
  PeerThreadSummary
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
    if (message.action === Action.BuyerTookOrder || message.action === Action.AddInvoice) {
      // If the action is BuyerTookOrder we're receiving the buyer's identity
      // so here we expand our order data with it.
      const { content } = message
      if (content.SmallOrder) {
        const { seller_pubkey, buyer_pubkey } = content.SmallOrder
        const order = await rootGetters['orders/getOrderById'](message.order_id)
        order.seller_pubkey = seller_pubkey
        order.buyer_pubkey = buyer_pubkey
        dispatch('orders/updateOrder', order, { root: true })
      }
    }
    commit('addMostroMessage', message)
  },
  addMostroTextMessage(context: any, message: TextMessage) {
    console.log('addMostroTextMessage. message: ', message)
    const { commit } = context
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
      return state.messages.mostro
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