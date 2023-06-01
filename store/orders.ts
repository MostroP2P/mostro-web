import Vue from 'vue'
import { Order, OrderMapType, OrderState } from './types'

export const state = () => ({
  orders: Vue.observable(new Map<string, Order>()),
  userOrders: {} as OrderMapType
})

export const actions = {
  addOrder(context: any, order: Order) {
    const { commit, state } = context
    if (!state.orders.has(order.id)) {
      // Because of the asynchronous nature of messages, we can
      // have an order being added from the network which we already know
      // is ours from the local storage data. So here we check the
      // `userOrders` map
      if (state.userOrders[order.id]) {
        order.is_mine = true
      }
      commit('addOrder', order)
    }
  },
  addUserOrder(context: any, order: Order) {
    const { commit, dispatch } = context
    order.is_mine = true
    dispatch('addOrder', order)
    commit('addUserOrder', order)
  },
  setUserOrders(context: any, userOrders: OrderMapType) {
    const { commit } = context
    Object.keys(userOrders).forEach(orderId => commit('setAsMine', orderId))
    commit('setUserOrders', userOrders)
  },
  removeOrder(context: any, order: Order) {
    const { commit } = context
    commit('removeOrder', order)
  },
  updateOrder(context: any, order: Order) {
    const { commit, dispatch } = context
    dispatch('notifications/checkOrderForNotification', order, { root: true })
    commit('updateOrder', order)
  }
}

export const mutations = {
  addOrder(state: OrderState, order: Order) {
    const newOrders = new Map<string, Order>(state.orders)
    newOrders.set(order.id, order)
    Vue.set(state, 'orders', newOrders)
  },
  setUserOrders(state: OrderState, userOrders: OrderMapType) {
    Vue.set(state, 'userOrders', userOrders)
  },
  addUserOrder(state: OrderState, order: Order) {
    Vue.set(state.userOrders, `${order.id}`, true)
  },
  setAsMine(state: OrderState, orderId: string) {
    const updatedOrders = new Map<string, Order>(state.orders)
    const existingOrder = updatedOrders.get(orderId)
    if (existingOrder) {
      existingOrder.is_mine = true
      updatedOrders.set(orderId, existingOrder)
    }
    Vue.set(state, 'orders', updatedOrders)
  },
  removeOrder(state: OrderState, order: Order) {
    const newOrders = new Map<string, Order>()
    newOrders.delete(order.id)
    Vue.set(state, 'orders', newOrders)
  },
  updateOrder(state: OrderState, newOrder: Order) {
    const updatedOrders = new Map<string, Order>(state.orders)
    const orderId = newOrder.id
    if (state.orders.has(orderId)) {
      // We don't want to overwrite buyer & seller pubkeys
      const oldOrder =  state.orders.get(orderId)
      if (oldOrder?.buyer_pubkey) {
        newOrder.buyer_pubkey = oldOrder?.buyer_pubkey
      }
      if (oldOrder?.seller_pubkey) {
        newOrder.seller_pubkey = oldOrder?.seller_pubkey
      }
      // Or the 'is_mine' attribute
      if (oldOrder?.is_mine) {
        newOrder.is_mine = true
      }
    }
    updatedOrders.set(orderId, newOrder)
    Vue.set(state, 'orders', updatedOrders)
  }
}

export const getters = {
  getPendingOrders(state: OrderState) {
    const orderList: Order[] = []
    state.orders.forEach((order: Order) => orderList.push(order))
    return orderList
      .filter((order: Order) => order.status === 'Pending')
      .sort((orderA: Order, orderB: Order) => orderB.created_at - orderA.created_at)
  },
  getOrderStatus(state: OrderState) {
    return (orderId: string) => state.orders.get(orderId)?.status
  },
  getOrderById(state: OrderState) {
    return (orderId: string) => state.orders.get(orderId)
  },
  getUserOrderIds(state: OrderState) {
    return state.userOrders
  }
}