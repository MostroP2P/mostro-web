import { defineStore } from 'pinia'
import { OrderStatus, Order, OrderType, Notification, DismissedNotificationMap } from './types'
import { useOrders } from '@/stores/orders'

export const useNotifications = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    dismissedNotifications: {} as DismissedNotificationMap
  }),
  actions: {
    setDismissedNotifications(
      dismissedNotifications: DismissedNotificationMap
    ) {
      this.dismissedNotifications = dismissedNotifications
    },
    addNotification(notification: Notification) {
      this.notifications.push(notification)
    },
    checkOrderForNotification(
      { order, eventId } : { order: Order, eventId: string }
    ) {
      const orderStore = useOrders()
      const userOrders = orderStore.getUserOrderIds
      if (userOrders[order.id]) {
        // This is a user's order
        const storedOrder = orderStore.getOrderById(order.id)
        if (storedOrder.status === OrderStatus.PENDING || true) {
          const notification: Notification = {
            eventId,
            title: `Your ${order.kind === OrderType.SELL ? 'Sell' : 'Buy'} order was taken!`,
            subtitle: 'Click here to see more details',
            orderId: order.id,
            dismissed: this.dismissedNotifications[eventId] !== undefined
          }
          this.notifications.push(notification)
        }
      }
    },
    dismiss(notification: Notification) {
      const targetNotification = this.notifications.findIndex(n => n.eventId === notification.eventId)
      if (targetNotification !== -1) {
        this.notifications[targetNotification].dismissed = true
      }
    }
  },
  getters: {
    getActiveNotifications(state) {
      return state.notifications.filter(n => !n.dismissed)
    }
  }
})