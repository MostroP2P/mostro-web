import Vue from 'vue'
import { Order } from './types'

export interface OrderState {
  orders: Map<string, Order>
}

export const state = () => ({
  orders: Vue.observable(new Map<string, Order>())
})

export const actions = {
  addOrder(context: any, order: Order) {
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
    updatedOrders.set(newOrder.id, newOrder)
    Vue.set(state, 'orders', updatedOrders)
  }
}

export const getters = {
  getPendingOrders(state: OrderState) {
    const orderList: Order[] = []
    state.orders.forEach((order: Order) => orderList.push(order))
    return orderList.filter((order: Order) => order.status === 'Pending')
  },
  getOrderStatus(state: OrderState) {
    return (orderId: string) => state.orders.get(orderId)?.status
  },
  getOrderById(state: OrderState) {
    return (orderId: string) => state.orders.get(orderId)
  }
}