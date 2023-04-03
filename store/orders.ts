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

export const state = () => ({
  orders: []
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
  addOrder(state: any, order: Order) {
    state.orders = [order, ...state.orders]
  },
  removeOrder(state: any, order: Order) {
    const index = state.orders.findIndex((item: Order) => item.id === order.id)
    if (index !== -1) {
      state.orders.splice(index, 1)
    }
  }
}

export const getters = {
  getPendingOrders(state: any) {
    return state.orders.filter((order: Order) => order.status === 'Pending')
  }
}