import Vue from 'vue'
import { ActionContext } from 'vuex'
import { NotificationState, OrderStatus, OrderType, USER_ORDERS_KEY } from '~/store/types'
import { RootState, Notification } from './types'
import { Order } from './types'

type NotificationActionContext = ActionContext<NotificationState, RootState>

export const state = (): NotificationState => ({
  notifications: []
})

export const actions = {
  checkOrderForNotification({ rootGetters, commit }: NotificationActionContext, order: Order) {
    const userOrders = rootGetters['orders/getUserOrderIds']
    if (userOrders[order.id]) {
      // This is a user's order
      const storedOrder = rootGetters['orders/getOrderById'](order.id)
      if (storedOrder.status === OrderStatus.PENDING || true) {
        const notification: Notification = {
          title: `Your ${order.kind === OrderType.SELL ? 'Sell' : 'Buy'} order was taken!`,
          subtitle: 'Click here to see more details',
          orderId: order.id,
          dismissed: false
        }
        commit('addNotification', notification)
      }
    }
  },
  dismiss({ state, commit }: NotificationActionContext, notification: Notification) {
    const targetNotification = state.notifications.findIndex(n => n.orderId === notification.orderId)
    if (targetNotification !== -1) {
      commit('dismiss', notification)
    }
  }
}

export const mutations = {
  addNotification(state: NotificationState, notification: Notification) {
    const notifications = [...state.notifications]
    notifications.push(notification)
    Vue.set(state, 'notifications', notifications)
  },
  dismiss(state: NotificationState, notification: Notification) {
    const updatedNotifications = [...state.notifications]
    const index = updatedNotifications.findIndex((not: Notification) => not.orderId === notification.orderId)
    if (index !== -1) {
      updatedNotifications[index].dismissed = true
    }
    Vue.set(state, 'notifications', updatedNotifications)
  }
}

export const getters = {
  getActiveNotifications(state: NotificationState) {
    return [...state.notifications].filter(notification => !notification.dismissed)
  }
}