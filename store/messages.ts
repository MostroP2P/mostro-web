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

const decodeInvoiceAcceptedTextMessage = (message: TextMessage) => {
  const { text } = message
  // This will have to be removed later when the message format changes
  const orderIdRegex = /Order\sId:\s+(\S+)/
  const buyerPubkeyRegex = /([^\s]+)\s+has\staken\syour\sorder\sand\swants\sto\sbuy\syour\ssats\./
  const paymentDetailsRegex = /Get\sin\stouch\sand\stell\shim\/her\show\sto\ssend\syou\s(\S+)\s(\S+)\sthrough\s(\S+)\./
  const orderIdMatch = orderIdRegex.exec(text)
  const buyerPubkeyMatch = buyerPubkeyRegex.exec(text)
  const paymentDetailsMatch = paymentDetailsRegex.exec(text)
  const orderId = orderIdMatch ? orderIdMatch[1] : null
  const buyerPubkey = buyerPubkeyMatch ? buyerPubkeyMatch[1] : null
  const fiatCode = paymentDetailsMatch ? paymentDetailsMatch[1] : null
  const fiatAmount = paymentDetailsMatch ? paymentDetailsMatch[2] : null
  const paymentMethod = paymentDetailsMatch ? paymentDetailsMatch[3] : null
  const msg = {
    version: 0,
    order_id: orderId,
    action: Action.InvoiceAccepted,
    content: {
      InvoiceAccepted: {
        buyer: buyerPubkey,
        fiatCode,
        fiatAmount,
        paymentMethod
      }
    },
    created_at: message.created_at
  }
  const matches = buyerPubkey !== null &&
    fiatCode !== null &&
    fiatAmount !== null &&
    paymentMethod !== null

  return { matches, msg }
}

const decodeFiatSentMessage = (message: TextMessage) => {
  const { text } = message
  // This will have to be removed later when the message format changes
  const orderIdRegex = /Order\sId:\s+(\S+)/
  const buyerPubkeyRegex = /([^\s]+)\s+has\sinformed\sthat\salready\ssent\syou\sthe\sfiat\smoney/
  const orderIdMatch = orderIdRegex.exec(text)
  const buyerPubkeyMatch = buyerPubkeyRegex.exec(text)
  const orderId = orderIdMatch ? orderIdMatch[1] : null
  const buyerPubkey = buyerPubkeyMatch ? buyerPubkeyMatch[1] : null
  const msg = {
    version: 0,
    order_id: orderId,
    action: Action.FiatSent,
    content: {
      Peer: {
        pubkey: buyerPubkey
      }
    },
    created_at: message.created_at
  }
  const matches = orderId !== null && buyerPubkey !== null
  return { matches, msg }
}

const decodeSaleCompletedMessage = (message: TextMessage) => {
  const { text } = message
  const orderIdRegex = /Order\sId:\s+(\S+)/
  const buyerPubkeyRegex = /Your\ssale\sof\ssats\shas\sbeen\scompleted\safter\sconfirming\spayment\sfrom\s([^\s]+)\s⚡️🍊⚡️/
  const orderIdMatch = orderIdRegex.exec(text)
  const buyerPubkeyMatch = buyerPubkeyRegex.exec(text)
  const orderId = orderIdMatch ? orderIdMatch[1] : null
  const buyerPubkey = buyerPubkeyMatch ? buyerPubkeyMatch[1] : null
  const msg = {
    version: 0,
    order_id: orderId,
    action: Action.SaleCompleted,
    content: {
      Peer: {
        pubkey: buyerPubkey
      }
    },
    created_at: message.created_at
  }
  const matches = orderId !== null && buyerPubkey !== null
  return { matches, msg }
}

export const state = () => ({
  messages: {
    mostro: [] as MostroMessage[],
    peer: {}
  }
})

export const actions = {
  addMostroMessage(context: any, message: MostroMessage) {
    const { commit } = context
    commit('addMostroMessage', message)
  },
  addMostroTextMessage(context: any, message: TextMessage) {
    const { commit } = context
    const invoiceAccepted = decodeInvoiceAcceptedTextMessage(message)
    if (invoiceAccepted.matches) {
      commit('addMostroMessage', invoiceAccepted.msg)
      return
    }
    const fiatSent = decodeFiatSentMessage(message)
    if (fiatSent.matches) {
      commit('addMostroMessage', fiatSent.msg)
      return
    }
    const saleCompleted = decodeSaleCompletedMessage(message)
    if (saleCompleted.matches) {
      commit('addMostroMessage', saleCompleted.msg)
    }
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
  getMostroMessagesByOrderId(state: MessagesState ) {
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