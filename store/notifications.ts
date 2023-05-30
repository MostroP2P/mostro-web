import { USER_ORDERS_KEY } from '~/store/types'
import { Order } from './types'

export interface Notification {
  title: string,
  subtitle: string,
  orderId: string
}

export const state = () => ({
  notifications: []
})

export const actions = {
  checkNotification(context: any, order: Order) {
    // TODO: verify if a notification needs to be triggered
  }
}