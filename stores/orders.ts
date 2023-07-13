import { useNotifications } from '@/stores/notifications'
import { Order, OrderMapType, OrderOwnershipMapType, ScheduledOrderUpdatePayload } from './types'

export const useOrders = defineStore('orders', {
  state: (): { orders: OrderMapType, userOrders: OrderOwnershipMapType }  => ({
    orders: {},
    userOrders: {}
  }),
  actions: {
    addOrder({ order, eventId }: {order: Order, eventId: string }) {
      if (!this.orders[order.id]) {
        // Because of the asynchronous nature of messages, we can
        // have an order being added from the network which we already know
        // is ours from the local storage data. So here we check the
        // `userOrders` map
        if (this.userOrders[order.id]) {
          order.is_mine = true
        }
        this.orders[order.id] = order
      }
      const notificationStore = useNotifications()
      notificationStore.checkOrderForNotification({ order, eventId })
    },
    addUserOrder({ order, eventId }: {order: Order, eventId: string}) {
      if (!this.orders[order.id]) {
        // If the order doesn't yet exist, we add it
        this.orders[order.id] = order
      }
      // We mark it as ours and add it to the `userOrders` map
      this.orders[order.id].is_mine = true
      this.userOrders[order.id] = true
    },
    removeOrder(order: Order) {
      delete this.orders[order.id]
    },
    updateOrder({ order, eventId }: {order: Order, eventId: string }) {
      const notificationStore = useNotifications()
      notificationStore.checkOrderForNotification({ order, eventId })

      const existingOrder = this.orders[order.id]      
      if (existingOrder) {
        // We just update buyer & seller pubkeys if they're not set yet
        if (!existingOrder.buyer_pubkey) {
          existingOrder.buyer_pubkey = order.buyer_pubkey
        }
        if (!existingOrder.seller_pubkey) {
          existingOrder.seller_pubkey = order.seller_pubkey
        }
        // A similar treatment is done for the 'is_mine' flag
        if (!existingOrder.is_mine) {
          existingOrder.is_mine = order.is_mine
        }
        // The 'status' is always updates
        existingOrder.status = order.status
        // Updating the 'orders' object
        this.orders[order.id] = {...existingOrder}
      } else {
        console.warn(`Could not find order with id ${order.id} to update`)
      }
    },
        // Sometimes we'll get messages out of order, and because of this
    // an order update might come before the order itself. For these
    // cases we want to schedule the order update for later.
    // A simple polling mechanism is used for now, a more sophisticated
    // callback registration mechanism could also be used.
    scheduleOrderUpdate(payload: ScheduledOrderUpdatePayload) {
      const RETRY_INTERVAL = 1E3
      const { orderId, eventId } = payload
      const order = this.orders[orderId]
      if (!order) {
        // If there's no order, we just schedule the dispatch of the same
        // action after RETRY_INTERVAL milliseconds
        setTimeout(async () => {
          this.scheduleOrderUpdate(payload)
        }, RETRY_INTERVAL)
      } else {
        // If we finally found an order, we update it by calling the mutation,
        // but not before we remove the 'orderId' key
        const toUpdate = Object.assign({}, payload)
        // @ts-ignore
        delete toUpdate.orderId
        // @ts-ignore
        delete toUpdate.eventId
        Object.keys(toUpdate).forEach(key => {
          // @ts-ignore
          order[key] = toUpdate[key]
        })
        this.updateOrder({ order, eventId })
        const notificationStore = useNotifications()
        notificationStore.checkOrderForNotification({ order, eventId })
      }
    }
  },
  getters: {
    getPendingOrders(state) {
      const orderList: Order[] = []
      Object.values(state.orders).forEach(order => orderList.push(order))
      return orderList
        .filter(order => order.status === 'Pending')
        .sort((orderA, orderB) => orderB.created_at - orderA.created_at)
    },
    getOrderStatus(state) {
      return (orderId: string) => state.orders[orderId]?.status
    },
    getOrderById(state) {
      return (orderId: string) => state.orders[orderId]
    },
    getUserOrderIds(state) {
      return state.userOrders
    }
  }
})