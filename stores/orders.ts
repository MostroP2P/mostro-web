import { NDKEvent } from '@nostr-dev-kit/ndk'
import { Action, OrderStatus, type OrderMapType, type OrderOwnershipMapType } from './types'
import type { Mostro } from '~/utils/mostro'
import type { MostroMessage, Order } from '~/utils/mostro/types'

export const ORDER_LIFETIME_IN_SECONDS = 24 * 60 * 60 // 24 hours

const getOrderExpiration = (order: Order) => {
  return order.created_at + ORDER_LIFETIME_IN_SECONDS
}

export const useOrders = defineStore('orders', {
  state: (): { orders: OrderMapType, userOrders: OrderOwnershipMapType }  => ({
    orders: {},
    userOrders: {}
  }),
  actions: {
    nuxtClientInit() {
      const mostro = useNuxtApp().$mostro as Mostro
      mostro.on('order-update', (order: Order, ev: NDKEvent) => {
        this.addOrder({ order, event: ev })
      })
      mostro.on('mostro-message', (message: MostroMessage, ev: NDKEvent) => {
        const orderMessage = message.order
        if (orderMessage && orderMessage.action === Action.NewOrder) {
          // If we get a mostro message with a new-order action,
          // this means we got an ack to our order submission. Which means
          // this order is ours.
          const order = orderMessage.content.order as Order
          this.addUserOrder({ order, event: ev })
        }
      })
    },
    addOrder({ order, event }: {order: Order, event: NDKEvent }) {
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
    addUserOrder({ order, event }: {order: Order, event: NDKEvent}) {
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
    updateOrder({ order, event } : {order: Order, event: NDKEvent }, updateStatus: boolean = false) {
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
          // We don't want to update an order's status if the event timestamp is older
          // than the `updated_at` field of the stored order, if we have one
          if (!existingOrder.updated_at || event.created_at && event?.created_at > existingOrder?.updated_at) {
            existingOrder.status = order.status
          }
        }
        // Updating amount for range orders
        existingOrder.fiat_amount = order.fiat_amount
        // Adds or updates the 'update_at' field
        existingOrder.updated_at = !existingOrder.updated_at ?  order.created_at : Math.max(existingOrder.updated_at, event.created_at as number)
      } else {
        console.warn(`Could not find order with id ${order.id} to update`)
      }
    },
    updateOrderRating({ order, rating, confirmed }: {order: Order, rating: number, confirmed: boolean}) {
      const existingOrder = this.orders[order.id]
      if (!existingOrder) {
        console.warn(`Could not find order with id ${order.id} to update`)
        return
      }
      existingOrder.rating = {
        value: rating,
        confirmed
      }
      existingOrder.updated_at = Math.floor(Date.now() / 1E3)
    },
    updateOrderStatus(orderId: string, action: Action, event: NDKEvent) {
      const existingOrder = this.orders[orderId]
      if (!existingOrder) {
        console.warn('No order to update')
        return
      }
      if (
        existingOrder.updated_at &&
        event.created_at &&
        existingOrder.updated_at > event.created_at
      ) {
        console.debug(`Ignoring event ${event.id} for order ${orderId} because it's older than the current state, action: ${action}`)
        return
      }
      switch(action) {
        case Action.AddInvoice:
          if (existingOrder.status === OrderStatus.WAITING_PAYMENT) {
            existingOrder.status = OrderStatus.WAITING_BUYER_INVOICE
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          if (existingOrder.status === OrderStatus.WAITING_BUYER_INVOICE) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          // When the buyer is the taker
          if (existingOrder.status === OrderStatus.PENDING) {
            existingOrder.status = OrderStatus.WAITING_BUYER_INVOICE
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          break
        case Action.WaitingSellerToPay:
          if (existingOrder.status === OrderStatus.PENDING) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          break
        case Action.PayInvoice:
          if (existingOrder.status === OrderStatus.PENDING) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          break
        case Action.FiatSent:
          if (existingOrder.status === OrderStatus.ACTIVE) {
            existingOrder.status = OrderStatus.FIAT_SENT
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          break
        case Action.PurchaseCompleted:
          existingOrder.status = OrderStatus.SUCCESS
          existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          break
        case Action.WaitingSellerToPay:
          if (existingOrder.status === OrderStatus.WAITING_BUYER_INVOICE) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
            existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          }
          break
        case Action.HoldInvoicePaymentAccepted:
        case Action.BuyerTookOrder:
          existingOrder.status = OrderStatus.ACTIVE
          existingOrder.updated_at = Math.floor(Date.now() / 1E3)
          break
      }
    },
    markDisputed(order: Order, event: NDKEvent) {
      const existingOrder = this.orders[order.id]
      if (!existingOrder) {
        console.warn(`Could not find order with id ${order.id} to mark as disputed`)
        return
      }
      // if (event.created_at && existingOrder.updated_at && event.created_at < existingOrder.updated_at) {
      //   console.warn(`Ignoring event ${event.id} for order ${order.id} because it's older than the current state`)
      //   return
      // }
      existingOrder.disputed = true
      existingOrder.updated_at = Math.floor(Date.now() / 1E3)
    }
  },
  getters: {
    getPendingOrders(state) {
      const orderList: Order[] = []
      Object.values(state.orders).forEach(order => orderList.push(order))
      return orderList
        .filter(order => order.status === OrderStatus.PENDING)
        .filter(order => getOrderExpiration(order) > Math.floor(Date.now() / 1E3))
        .sort((orderA, orderB) => orderB.created_at - orderA.created_at)
    },
    getOrderStatus(state) {
      return (orderId: string) => state.orders[orderId]?.status
    },
    getOrderById(state) : (orderId: string) => Order | undefined {
      return (orderId: string) => state.orders[orderId]
    },
    getUserOrderIds(state) {
      return state.userOrders
    }
  }
})