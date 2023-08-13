import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useOrders } from '@/stores/orders'
import {
  OrderStatus,
  Order,
  OrderType,
  Notification,
  NOTIFICATIONS_KEY,
  OrderMapType
} from './types'

export const useNotifications = defineStore('notifications', () => {
  const orders = useOrders()
  const notifications = ref([] as Notification[])

  const getTitle = (order: Order, oldOrder: Order): string => {
    const {
      PENDING,
      WAITING_BUYER_INVOICE,
      WAITING_PAYMENT,
      ACTIVE,
      FIAT_SENT,
      SETTLE_HODL_INVOICE
    } = OrderStatus
    if (order.kind === OrderType.SELL) {
      if (order.status === WAITING_BUYER_INVOICE && oldOrder.status === PENDING) {
        return 'Your sell order was just taken!'
      } else if (order.status === WAITING_PAYMENT && oldOrder.status === WAITING_BUYER_INVOICE) {
        return 'You need to fund the escrow'
      } else if (order.status === ACTIVE && oldOrder.status === WAITING_PAYMENT) {
        return 'Get in touch with the buyer'
      } else if (order.status === FIAT_SENT && oldOrder.status === ACTIVE) {
        return 'The buyer has sent the fiat'
      } else if (order.status === SETTLE_HODL_INVOICE && oldOrder.status === FIAT_SENT) {
        return 'The sats were released!'
      }
      return '?'
    } else if (order.kind === OrderType.BUY) {
      if (order.status === WAITING_PAYMENT && oldOrder.status === PENDING) {
        return 'Your buy order was just taken!'
      } else if (order.status === WAITING_BUYER_INVOICE && oldOrder.status === WAITING_PAYMENT) {
        return 'You need to provide an invoice'
      } else if (order.status === ACTIVE && oldOrder.status === WAITING_BUYER_INVOICE) {
        return 'Get in touch with the seller'
      } else if (order.status === FIAT_SENT && oldOrder.status === ACTIVE) {
        return 'You have sent the fiat'
      } else if (order.status === SETTLE_HODL_INVOICE && oldOrder.status === FIAT_SENT) {
        return 'The sats were released!'
      }
      return '?'
    } else {
      return 'Unknown order type'
    }
  }

  const generateNotification = (newOrder: Order, oldOrder: Order) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const notification: Notification = {
      timestamp: timestamp,
      title: getTitle(newOrder, oldOrder),
      subtitle: `Order for ${newOrder.fiat_amount} ${newOrder.fiat_code.toUpperCase()} - T: ${timestamp}, S: ${newOrder.status}`,
      orderId: newOrder.id,
      dismissed: false
    }
    const existingNotificationIndex = notifications.value.findIndex(n => n.orderId === newOrder.id)
    if (existingNotificationIndex !== -1) {
      // Replaces an existing notification
      notifications.value.splice(existingNotificationIndex, 1, notification)
    } else {
      // Adds a notification for the first time
      notifications.value.push(notification)
    }
  }

  const init = () => {
    const storedNotifications = useLocalStorage(NOTIFICATIONS_KEY, [] as Notification[])
    notifications.value = storedNotifications.value

    watch(notifications, newNotifications => {
      storedNotifications.value = newNotifications
    },
      { deep: true }
    )

    const ordersState = computed(() => {
      // Return a string representation of the properties you want to watch
      return JSON.stringify(orders.orders);
    });

    watch(ordersState, (newState, oldState) => {
      const newOrderMap: OrderMapType = JSON.parse(newState)
      const oldOrderMap: OrderMapType = JSON.parse(oldState)
      Object.keys(newOrderMap).forEach((key) => {
        const newOrder = newOrderMap[key]
        const oldOrder = oldOrderMap[key]
        // Check if the order is new or has changed
        if (!oldOrder || oldOrder.status !== newOrder.status) {
          console.log(`>> Order ${newOrder.id} status changed from ${oldOrder?.status} to ${newOrder.status}, is mine: ${newOrder.is_mine}`)
          if (newOrder.is_mine) {
            if (newOrder.status === OrderStatus.WAITING_BUYER_INVOICE ||
              newOrder.status === OrderStatus.WAITING_PAYMENT ||
              newOrder.status === OrderStatus.ACTIVE ||
              newOrder.status === OrderStatus.FIAT_SENT
            ) {
              generateNotification(newOrder, oldOrder)
            }
          }
        }
      })
    })
  }

  const dismiss = (notification: Notification) => {
    const index = notifications.value.findIndex(n => n.orderId === notification.orderId)
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
        notifications.value.splice(index, 1)
      } else {
        notification.dismissed = true
      }
    }
  }
  const getActiveNotifications = computed(() => {
    return notifications.value
      .filter(n => !n.dismissed)
      .sort((a, b) => b.timestamp - a.timestamp)
  })
  return { init, dismiss, getActiveNotifications }
})