import Vue from 'vue'
import { Order } from './types'

const USER_ORDERS_KEY = 'user-orders-key'

export interface OrderState {
  orders: Map<string, Order>
}

export const state = () => ({
  orders: Vue.observable(new Map<string, Order>())
})

const updateLocalStorage = (order: Order) => {
  if (order.is_mine) {
    const userOrdersStr = localStorage.getItem(USER_ORDERS_KEY)
    let userOrders: string[] = []
    if (userOrdersStr) {
      userOrders = JSON.parse(userOrdersStr) as string[]
      userOrders.push(order.id)
    } else {
      userOrders = [order.id]
    }
    localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(userOrders))
  }
}

const readLocalStorage = (order: Order) => {
  const userOrdersStr = localStorage.getItem(USER_ORDERS_KEY)
  let userOrderIds: string[] = []
  if (userOrdersStr) {
    userOrderIds = JSON.parse(userOrdersStr) as string[]
    for (let i = 0; i < userOrderIds.length; i++) {
      const userOrderId = userOrderIds[i]
      if (userOrderId === order.id) {
        order.is_mine = true
        break
      }
    }
  }
}

export const actions = {
  addOrder(context: any, order: Order) {
    readLocalStorage(order)
    const { commit, state } = context
    if (!state.orders.has(order.id)) {
      commit('addOrder', order)
    }
  },
  addUserOrder(context: any, order: Order) {
    updateLocalStorage(order)
    const { commit } = context
    commit('addOrder', order)
  },
  removeOrder(context: any, order: Order) {
    const { commit } = context
    commit('removeOrder', order)
  },
  updateOrder(context: any, order: Order) {
    const { commit } = context
    commit('updateOrder', order)
  }
}

export const mutations = {
  addOrder(state: OrderState, order: Order) {
    const newOrders = new Map<string, Order>(state.orders)
    newOrders.set(order.id, order)
    Vue.set(state, 'orders', newOrders)
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
  }
}