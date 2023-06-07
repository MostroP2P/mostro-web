import Vue from 'vue'
import { ActionContext } from 'vuex'
import { NotificationState, OrderStatus, OrderType } from '~/store/types'
import { RootState, Notification, DismissedNotificationMap } from './types'
import { Order } from './types'

type NotificationActionContext = ActionContext<NotificationState, RootState>

export const state = (): NotificationState => ({
  notifications: [],
  dismissedNotifications: {} as DismissedNotificationMap
})

export const actions = {
  setDismissedNotifications(
    { commit }: NotificationActionContext,
    dismissedNotifications: DismissedNotificationMap
  ) {
    commit('setDismissedNotifications', dismissedNotifications)
  },
  checkOrderForNotification(
    { state, rootGetters, commit }: NotificationActionContext,
    { order, eventId } : { order: Order, eventId: string }
  ) {
    const userOrders = rootGetters['orders/getUserOrderIds']
    if (userOrders[order.id]) {
      // This is a user's order
      const storedOrder = rootGetters['orders/getOrderById'](order.id)
      if (storedOrder.status === OrderStatus.PENDING || true) {
        const notification: Notification = {
          eventId,
          title: `Your ${order.kind === OrderType.SELL ? 'Sell' : 'Buy'} order was taken!`,
          subtitle: 'Click here to see more details',
          orderId: order.id,
          dismissed: state.dismissedNotifications[eventId] !== undefined
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
  setDismissedNotifications(state: NotificationState, dismissedNotifications: DismissedNotificationMap) {
    state.dismissedNotifications = dismissedNotifications
  },
  addNotification(state: NotificationState, notification: Notification) {
    const notifications = [...state.notifications]
    notifications.push(notification)
    Vue.set(state, 'notifications', notifications)
  },
  dismiss(state: NotificationState, notification: Notification) {
    const updatedNotifications = [...state.notifications]
    const index = updatedNotifications.findIndex((not: Notification) => not.eventId === notification.eventId)
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