import { Store } from 'vuex'
import { RootState, DismissedNotificationMap, USER_ORDERS_KEY, DISMISSED_NOTIFICATION_KEY } from '~/store/types'

export default ({ store } : { store: Store<RootState>}) => {
  if (localStorage) {
    // Reading user orders from the local storage
    const storedUserOrders = localStorage.getItem(USER_ORDERS_KEY) || '{}'
    const userOrders = JSON.parse(storedUserOrders)
    store.dispatch('orders/setUserOrders', userOrders)

    // Reading notification data from the local storage
    let dismissedNotifications = localStorage.getItem(DISMISSED_NOTIFICATION_KEY) || '{}'
    dismissedNotifications = JSON.parse(dismissedNotifications)
    store.dispatch('notifications/setDismissedNotifications', dismissedNotifications)
  }

  store.subscribe((mutation) => {
    if (mutation.type.startsWith('orders/')) {
      if (mutation.type === 'orders/addUserOrder') {
        storeUserOrder(mutation.payload)
      }
    }
    if (mutation.type.startsWith('notifications/')) {
      if (mutation.type === 'notifications/dismiss') {
        storeDismissedNotification(mutation.payload)
      }
    }
  })
}

const storeUserOrder = ({ id } : {id :string}) => {
  const userOrderStr = localStorage.getItem(USER_ORDERS_KEY) || '{}'
  const userOrders = JSON.parse(userOrderStr)
  userOrders[id] = true
  localStorage.setItem(USER_ORDERS_KEY, JSON.stringify(userOrders))
}
const storeDismissedNotification = ({ eventId }: { eventId : string }) => {
  const dismissedNotificationsStr = localStorage.getItem(DISMISSED_NOTIFICATION_KEY) || '{}'
  const dismissedNotifications: DismissedNotificationMap = JSON.parse(dismissedNotificationsStr)
  dismissedNotifications[eventId] = true
  localStorage.setItem(DISMISSED_NOTIFICATION_KEY, JSON.stringify(dismissedNotifications))
}