import type { MostroEvent } from '~/plugins/02-mostro'
import type { OrderMapType, OrderOwnershipMapType, ScheduledOrderUpdatePayload } from './types'
import { Order } from './types'

export const useOrders = defineStore('orders', {
  state: (): { orders: OrderMapType, userOrders: OrderOwnershipMapType }  => ({
    orders: {},
    userOrders: {}
  }),
  actions: {
    addOrder({ order, event }: {order: Order, event: MostroEvent }) {
      if (!this.orders[order.id]) {
        // Because of the asynchronous nature of messages, we can
        // have an order being added from the network which we already know
        // is ours from the local storage data. So here we check the
        // `userOrders` map
        if (this.userOrders[order.id]) {
          order.is_mine = true
        }
        // Adds the 'updated_at' field, setting it to the event's creation time
        order.updated_at = event.created_at
        this.orders[order.id] = order
      }
    },
    addUserOrder({ order, event }: {order: Order, event: MostroEvent}) {
      if (!this.orders[order.id]) {
        // If the order doesn't yet exist, we add it
        this.orders[order.id] = order
      }
      // We mark it as ours and add it to the `userOrders` map
      this.orders[order.id].is_mine = true
      // Adds the 'updated_at' field, setting it to the event's creation time
      order.updated_at = event.created_at
      this.userOrders[order.id] = true
    },
    removeOrder(order: Order) {
      delete this.orders[order.id]
    },
    updateOrder({ order, event } : {order: Order, event: MostroEvent }, updateStatus: boolean = false) {
      const existingOrder = this.orders[order.id]      
      if (existingOrder) {
        // We just update buyer & seller pubkeys if they're not set yet
        if (!existingOrder.master_buyer_pubkey && order.master_buyer_pubkey) {
          existingOrder.master_buyer_pubkey = order.master_buyer_pubkey
        }
        if (!existingOrder.master_seller_pubkey && order.master_seller_pubkey) {
          existingOrder.master_seller_pubkey = order.master_seller_pubkey
        }
        // A similar treatment is done for the 'is_mine' flag
        if (!existingOrder.is_mine) {
          existingOrder.is_mine = order.is_mine
        }
        // The 'status' is updated only if the `updateStatus` flag is set to `true`
        // This is because we want to update when receving a replaceable event, but
        // not necessarily when receiving a DM
        if (updateStatus) {
          existingOrder.status = order.status
        }
        // Adds or updates the 'update_at' field
        existingOrder.updated_at = !existingOrder.updated_at ?  order.created_at : Math.max(existingOrder.updated_at, event.created_at)
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
      const { orderId, event } = payload
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
        this.updateOrder({ order, event })
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