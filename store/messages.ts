import { Order } from './orders'
import { Action } from './action'
import { ThreadSummary } from './types'

type NullableOrder = Order | null
type PaymentRequest = [NullableOrder, string]
type InvoiceAccepted = {
  buyer: string,
  fiatAmount: number,
  fiatCode: string,
  paymentMethod: string
}
type FiatSent = {
  buyer: string
}

export type Message = {
  version: number,
  order_id: string,
  action: Action,
  content: {
    PaymentRequest?: PaymentRequest | Order,
    InvoiceAccepted?: InvoiceAccepted,
    FiatSent?: FiatSent
  },
  created_at: number
}

export type TextMessage = {
  text: string,
  created_at: number
}

export interface State {
  messages: Message[]
}

export const state = () => ({
  messages: [] as Message[]
})

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
      FiatSent: {
        buyer: buyerPubkey
      }
    },
    created_at: message.created_at
  }
  const matches = orderId !== null && buyerPubkey !== null
  return { matches, msg }
}

export const actions = {
  addMessage(context: any, message: Message) {
    const { commit } = context
    commit('addMessage', message)
  },
  addTextMessage(context: any, message: TextMessage) {
    const { commit } = context
    const invoiceAccepted = decodeInvoiceAcceptedTextMessage(message)
    if (invoiceAccepted.matches) {
      commit('addMessage', invoiceAccepted.msg)
      return
    }
    const fiatSent = decodeFiatSentMessage(message)
    if (fiatSent.matches) {
      commit('addMessage', fiatSent.msg)
    }
  }
}

export const mutations = {
  addMessage(state: State, message: Message) {
    state.messages = [message, ...state.messages]
  }
}

export const getters = {
  getThreadSummaries(state: State, getters: any, rootState : any) : ThreadSummary[] {
    const messageMap = new Map<string, number>
    for (const message of state.messages) {
      if (!messageMap.has(message.order_id)) {
        messageMap.set(message.order_id, 1)
      } else {
        let currentCount = messageMap.get(message.order_id) as number
        messageMap.set(message.order_id, currentCount + 1)
      }
    }
    return Array.from(messageMap).map(([orderId, messageCount]) => {
      const order = rootState.orders.orders.find((candidate: Order) => candidate.id === orderId)
      return { orderId, messageCount, order }
    })
  },
  getMessagesByOrderId(state: State) {
    return (orderId: string) => {
      return state.messages.filter((message: Message) => message.order_id === orderId)
        .sort((msgA: Message, msgB: Message) => msgA.created_at - msgB.created_at)
    }
  }
}