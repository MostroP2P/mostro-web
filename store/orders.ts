export enum OrderType {
  BUY = 'Buy',
  SELL = 'Sell'
}

export enum OrderStatus {
  ACTIVE = 'Active',
  CANCELED = 'Canceled',
  CANCELED_BY_ADMIN = 'CanceledByAdmin',
  COMPLETED_BY_ADMIN = 'CompletedByAdmin',
  DISPUTE = 'Dispute',
  EXPIRED = 'Expired',
  FIAT_SENT = 'FiatSent',
  SETTLE_HODL_INVOICE = 'SettledHoldInvoice',
  PENDING = 'Pending',
  SUCCESS = 'Success',
  WAITING_BUYER_INVOICE = 'WaitingBuyerInvoice',
  WAITING_PAYMENT = 'WaitingPayment'
}

export interface Order {
  id: string,
  kind: OrderType,
  status: OrderStatus,
  amount: number,
  fiat_code: string,
  fiat_amount: number,
  payment_method: string,
  prime: number,
  created_at: number,
}

export interface OrderState {
  orders: Map<string, Order>
}

export const state = () => ({
  orders: new Map<string, Order>()
})

export const actions = {
  addOrder(context: any, order: Order) {
    console.log('> addOrder: ', order)
    const { commit } = context
    commit('addOrder', order)
    //..
  },
  removeOrder(context: any, order: Order) {
    const { commit } = context
    commit('removeOrder', order)
  },
  updateOrder(context: any, order: Order) {
    const { commit } = context
    commit('removeOrder', order)
    commit('addOrder', order)
  }
}

export const mutations = {
  addOrder(state: OrderState, order: Order) {
    state.orders.set(order.id, order)
  },
  removeOrder(state: OrderState, order: Order) {
    if (state.orders.has(order.id)) {
      state.orders.delete(order.id)
    }
  }
}

export const getters = {
  getPendingOrders(state: OrderState) {
    const orderList: Order[] = []
    state.orders.forEach((order: Order) => orderList.push(order))
    return orderList.filter((order: Order) => order.status === 'Pending')
  }
}