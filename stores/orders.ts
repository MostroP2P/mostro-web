import { NDKEvent } from '@nostr-dev-kit/ndk'
import { OrderStatus, type OrderMapType, type OrderOwnershipMapType } from './types'
import type { Mostro } from '~/utils/mostro'
import { Action, type MostroMessage, type Order } from '~/utils/mostro/types'

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
        // This is a public order update, so we don't know if it's ours
        if (this.orders[order.id]) {
          // If the order already exists, we update it
          this.updateOrder({ order, event: ev }, true)
        } else {
          // If the order doesn't exist, we add it
          this.addOrder({ order, event: ev })
        }
      })
      mostro.on('mostro-message', (message: MostroMessage, ev: NDKEvent) => {
        const orderMessage = message.order
        if (orderMessage && orderMessage.action === Action.NewOrder) {
          // If we get a mostro message with a new-order action,
          // this means we got an ack to our order submission. Which means
          // this order is ours.
          const order = orderMessage.payload?.order as Order
          this.addUserOrder({ order, event: ev })
        } else if (orderMessage && orderMessage.action === Action.AddInvoice) {
          // If we get a mostro message with an add-invoice action,
          // this means mostro is waiting for a buyer invoice. Regardless of which side we're on
          // (either seller or buyer) the state of the order needs to be updated to waiting-buyer-invoice.
          this.updateOrderStatus(orderMessage.id as string, OrderStatus.WAITING_BUYER_INVOICE)
        } else if (orderMessage && orderMessage.action === Action.WaitingSellerToPay) {
          // If we get a mostro message with a waiting-seller-to-pay action,
          // this means mostro is waiting for the seller to pay a hold invoice. Regardless of which side we're on
          // (either seller or buyer) the state of the order needs to be updated to waiting-payment.
          this.updateOrderStatus(orderMessage.id as string, OrderStatus.WAITING_PAYMENT)
        }
      })
    },
    addOrder({ order, event }: {order: Order, event: NDKEvent }) {
      this.orders[order.id] = order
      this.orders[order.id].updated_at = event.created_at
      if (this.userOrders[order.id]) {
        // If the order is in the `userOrders` map, it means it's ours,
        // so we set the `is_mine` flag to `true`
        order.is_mine = true
      }
    },
    addUserOrder({ order, event }: {order: Order, event?: NDKEvent}) {
      if (!this.orders[order.id]) {
        // If the order doesn't yet exist, we add it
        this.orders[order.id] = order
      }
      this.orders[order.id].is_mine = true
      this.orders[order.id].updated_at = event?.created_at || Math.abs(Date.now() / 1E3)
      // We also add it to the `userOrders` map
      this.userOrders[order.id] = true
    },
    removeOrder(order: Order) {
      delete this.orders[order.id]
    },
    updateOrder({ order, event } : {order: Order, event: NDKEvent }, updateStatus: boolean = false) {
      const existingOrder = this.orders[order.id]
      if (existingOrder) {
        // Create a new object with the updated values to maintain reactivity
        this.orders[order.id] = {
          ...existingOrder,
          master_buyer_pubkey: (!existingOrder.master_buyer_pubkey && order.master_buyer_pubkey)
            ? order.master_buyer_pubkey
            : existingOrder.master_buyer_pubkey,
          master_seller_pubkey: (!existingOrder.master_seller_pubkey && order.master_seller_pubkey)
            ? order.master_seller_pubkey
            : existingOrder.master_seller_pubkey,
          buyer_trade_pubkey: (!existingOrder.buyer_trade_pubkey && order.buyer_trade_pubkey)
            ? order.buyer_trade_pubkey
            : existingOrder.buyer_trade_pubkey,
          seller_trade_pubkey: (!existingOrder.seller_trade_pubkey && order.seller_trade_pubkey)
            ? order.seller_trade_pubkey
            : existingOrder.seller_trade_pubkey,
          is_mine: existingOrder.is_mine || order.is_mine,
          status: updateStatus
            ? order.status
            : existingOrder.status,
          fiat_amount: order.fiat_amount,
          updated_at: !existingOrder.updated_at
            ? order.created_at
            : Math.max(existingOrder.updated_at, event.created_at as number)
        }
      } else {
        console.warn(`Could not find order with id ${order.id} to update`)
      }
    },
    updateOrderStatus(orderId: string, status: OrderStatus) {
      const existingOrder = this.orders[orderId]
      if (!existingOrder) {
        console.warn(`Could not find order with id ${orderId} to update`)
        return
      }
      existingOrder.status = status
      existingOrder.updated_at = Math.floor(Date.now() / 1E3)
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
    onOrderAction(orderId: string, action: Action, event: NDKEvent) {
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
          }
          if (existingOrder.status === OrderStatus.WAITING_BUYER_INVOICE) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
          }
          // When the buyer is the taker
          if (existingOrder.status === OrderStatus.PENDING) {
            existingOrder.status = OrderStatus.WAITING_BUYER_INVOICE
          }
          break
        case Action.WaitingSellerToPay:
          if (existingOrder.status === OrderStatus.PENDING) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
          }
          break
        case Action.PayInvoice:
          if (existingOrder.status === OrderStatus.PENDING) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
          }
          break
        case Action.FiatSent:
          if (existingOrder.status === OrderStatus.ACTIVE) {
            existingOrder.status = OrderStatus.FIAT_SENT
          }
          break
        case Action.PurchaseCompleted:
          existingOrder.status = OrderStatus.SUCCESS
          break
        case Action.WaitingSellerToPay:
          if (existingOrder.status === OrderStatus.WAITING_BUYER_INVOICE) {
            existingOrder.status = OrderStatus.WAITING_PAYMENT
          }
          break
        case Action.HoldInvoicePaymentAccepted:
        case Action.BuyerTookOrder:
          existingOrder.status = OrderStatus.ACTIVE
          break
      }
      existingOrder.updated_at = event.created_at
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
      existingOrder.updated_at = event.created_at
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