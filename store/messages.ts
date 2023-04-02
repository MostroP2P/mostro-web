import { Order } from './orders'
import { Action } from './action'

type NullableOrder = Order | null
type PaymentRequest = [NullableOrder, string]
type InvoiceAccepted = {
  buyer: string,
  fiatAmount: number,
  fiatCode: string,
  paymentMethod: string
}


export type Message = {
  version: number,
  order_id: string,
  action: Action,
  content: {
    PaymentRequest?: PaymentRequest | Order,
    InvoiceAccepted?: InvoiceAccepted
  }
}

export interface State {
  messages: Message[]
}


export const state: State = {
  messages: []
}

export const actions = {
  addMessage(context: any, message: Message) {
    const { commit } = context
    commit('addMessage', message)
  },
  addTextMessage(context: any, message: string) {
    // This will have to be removed later when the message format changes
    const orderIdRegex = /Order\sId:\s+(\S+)/
    const buyerPubkeyRegex = /([^\s]+)\s+has\staken\syour\sorder\sand\swants\sto\sbuy\syour\ssats\./
    const paymentDetailsRegex = /Get\sin\stouch\sand\stell\shim\/her\show\sto\ssend\syou\s(\S+)\s(\S+)\sthrough\s(\S+)\./
    const orderIdMatch = orderIdRegex.exec(message)
    const buyerPubkeyMatch = buyerPubkeyRegex.exec(message)
    const paymentDetailsMatch = paymentDetailsRegex.exec(message)
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
      }
    }
    const { commit } = context
    commit('addMessage', msg)
  }
}

export const mutations = {
  addMessage(state: State, message: Message) {
    state.messages = [message, ...state.messages]
  }
}