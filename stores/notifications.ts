import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useOrders } from '@/stores/orders'
import { useSoundPlayer } from '@/composables/useSoundPlayer'
import {
  OrderStatus,
  Order,
  OrderType,
  NOTIFICATIONS_KEY,
} from './types'
import type { Notification, OrderMapType } from './types'

export const useNotifications = defineStore('notifications', () => {
  const orders = useOrders()
  const notifications = ref([] as Notification[])

  const generateNotification = (newOrder: Order, oldOrder: Order) => {
    if (oldOrder !== undefined) {
      const { playSound } = useSoundPlayer()
      playSound('/notification.mp3')
    }
    let title = null
    let subtitle = null
    if (newOrder.is_mine) {
      // I am the maker
      if (newOrder.kind === OrderType.BUY) {
        // This is a buy, I am the BUYER as the MAKER
        if (newOrder.status === OrderStatus.WAITING_PAYMENT) {
          title = 'Someone took your buy order'
          subtitle = 'Hang in tight, the buyer is funding the escrow'
        } else if (newOrder.status === OrderStatus.WAITING_BUYER_INVOICE) {
          title = 'Invoice required'
          subtitle = 'Please provide an invoice to proceed'
        } else if (newOrder.status === OrderStatus.SETTLE_HODL_INVOICE) {
          title = 'The seller has released the sats'
          subtitle = 'Mostro has your sats, your invoice should be paid soon'
        } else if (newOrder.status === OrderStatus.SUCCESS) {
          title = 'Successful buy!'
          subtitle = 'Your trade was concluded, enjoy your sound money!'
        }
      } else {
        // This is a sell, I am the SELLER as the MAKER
        if (newOrder.status === OrderStatus.WAITING_PAYMENT) {
          title = 'Escrow funding required'
          subtitle = 'Please fund the escrow to continue'
        } else if (newOrder.status === OrderStatus.WAITING_BUYER_INVOICE) {
          title = 'Someone took your sell order'
          subtitle = 'Hang in tight, the buyer is providing an invoice'
        } else if (newOrder.status === OrderStatus.FIAT_SENT) {
          title = 'The buyer says the fiat was sent'
          subtitle = 'Please confirm and release the funds'
        }
      }
    } else {
      // I am the taker
      if (newOrder.kind === OrderType.BUY) {
        // This is a buy, I am the SELLER as the TAKER
        if (newOrder.status === OrderStatus.ACTIVE) {
          title = 'The buyer has accepted the trade'
          subtitle = 'Get in touch with the buyer'
        } else if (newOrder.status === OrderStatus.FIAT_SENT) {
          title = 'The buyer says the fiat was sent'
          subtitle = 'Please confirm and release the funds'
        }
      } else {
        // this is a sell, I am the BUYER as the TAKER
        if (newOrder.status === OrderStatus.ACTIVE) {
          title = 'The seller has accepted the trade'
          subtitle = 'Get in touch with the seller'
        } else if (newOrder.status === OrderStatus.SETTLE_HODL_INVOICE) {
          title = 'The seller has released the sats'
          subtitle = 'Just wait, your invoice should be paid soon'
        } else if (newOrder.status === OrderStatus.SUCCESS) {
          title = 'Successful buy!'
          subtitle = 'Your trade was concluded, enjoy your sound money!'
        }
      }
    }
    if (!title) return
    if (!subtitle) return

    const timestamp = Math.floor(Date.now() / 1000)
    const notification: Notification = {
      timestamp: timestamp,
      title: title,
      orderStatus: newOrder.status,
      subtitle: subtitle,
      orderId: newOrder.id,
      dismissed: false
    }
    const existingNotificationIndex = notifications.value.findIndex(n => n.orderId === newOrder.id)
    if (existingNotificationIndex !== -1) {
      // A notification for this order already exists
      const existingNotification = notifications.value[existingNotificationIndex]
      if (existingNotification.dismissed && existingNotification.title === title) {
        // The existing notification has the same title and was already dismissed
        // We don't need to add it again.
        return
      }
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
          if (newOrder.status === OrderStatus.WAITING_BUYER_INVOICE ||
            newOrder.status === OrderStatus.WAITING_PAYMENT ||
            newOrder.status === OrderStatus.ACTIVE ||
            newOrder.status === OrderStatus.FIAT_SENT ||
            newOrder.status === OrderStatus.SETTLE_HODL_INVOICE ||
            newOrder.status === OrderStatus.SUCCESS
          ) {
            generateNotification(newOrder, oldOrder)
          }
        }
      })
    })
  }

  const dismiss = (notification: Notification) => {
    const index = notifications.value.findIndex(n => n.orderId === notification.orderId)
    if (index !== -1) {
      notifications.value[index].dismissed = true
    }
  }
  const getActiveNotifications = computed(() => {
    return notifications.value
      .filter(n => !n.dismissed)
      .sort((a, b) => b.timestamp - a.timestamp)
  })
  return { init, dismiss, getActiveNotifications }
})