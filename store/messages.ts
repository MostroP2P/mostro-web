import { Order } from './orders'
import { Action } from './action'

type NullableOrder = Order | null
type PaymentRequest = [NullableOrder, string]


type Message = {
  version: number,
  order_id: string,
  action: Action,
  content: PaymentRequest | Order
}

interface State {
  messages: Message[]
}


export const state: State = {
  messages: []
}

export const actions = {
  addMessage(context: any, message: Message) {
    const { commit } = context
    commit('addMessage', message)
  }
}

export const mutations = {
  addMessage(state: State, message: Message) {
    state.messages = [message, ...state.messages]
  }
}