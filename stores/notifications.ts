import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { Event } from 'nostr-tools'
import { useOrders } from '@/stores/orders'
import {
  OrderStatus,
  Order,
  OrderType,
  Notification,
  NOTIFICATIONS_KEY
} from './types'

export const useNotifications = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
  }),
  actions: {
    init() {
      const storedNotifications = useLocalStorage(NOTIFICATIONS_KEY, [] as Notification[])
      this.notifications = storedNotifications.value

      watch(
        () => this.notifications,
        (newNotifications) => {
          storedNotifications.value = newNotifications
        },
        { deep: true }
      )
    },
    checkOrderForNotification(
      { order, event } : { order: Order, event: Event<4|30000> }
    ) {
      const orderStore = useOrders()
      const userOrders = orderStore.getUserOrderIds
      if (userOrders[order.id]) {
        const storedOrder = orderStore.getOrderById(order.id)
        const index = this.notifications.findIndex(n => n.orderId === order.id)
        if (index !== -1) {
          const notification = this.notifications[index]
          const notificationEventId = notification.eventId
          if (notificationEventId === event.id) {
            // The notification for this event was already added,
            // if it's not shown it's probably dismissed
            return
          }
          // If the event is different, it probably means that this is a new
          // request the original was probably not successful and the order
          // was just re-published
        }

        if (
          storedOrder.status === OrderStatus.WAITING_BUYER_INVOICE ||
          storedOrder.status === OrderStatus.WAITING_PAYMENT
        ) {
          const timestamp = Math.floor(Date.now() / 1000)
          const notification: Notification = {
            eventId: event.id,
            timestamp: timestamp,
            title: `Your ${order.kind === OrderType.SELL ? 'Sell' : 'Buy'} order was taken!`,
            subtitle: `Order for ${order.fiat_amount} ${order.fiat_code.toUpperCase()} - T: ${timestamp}, S: ${storedOrder.status}`,
            orderId: order.id,
            dismissed: false
          }
          const existingNotificationIndex = this.notifications.findIndex(n => n.orderId === order.id)
          if (existingNotificationIndex !== -1) {
            // Replaces an existing notification
            this.notifications.splice(existingNotificationIndex, 1, notification)
          } else {
            // Adds a notification for the first time
            this.notifications.push(notification)
          }
        }
      }
    },
    dismiss(notification: Notification) {
      const index = this.notifications.findIndex(n => n.eventId === notification.eventId)
      if (index !== -1) {
        const orderStore = useOrders()
        const storedOrder = orderStore.getOrderById(notification.orderId)
        if (!storedOrder ||
          storedOrder.status === OrderStatus.EXPIRED ||
          storedOrder.status === OrderStatus.CANCELED ||
          storedOrder.status === OrderStatus.CANCELED_BY_ADMIN ||
          storedOrder.status === OrderStatus.COMPLETED_BY_ADMIN ||
          storedOrder.status === OrderStatus.SUCCESS
        ) {
          this.notifications.splice(index, 1)
        } else {
          notification.dismissed = true
        }
      }
    }
  },
  getters: {
    getActiveNotifications(state) {
      return state.notifications
        .filter(n => !n.dismissed)
        .sort((a, b) => b.timestamp - a.timestamp)
    }
  }
})