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
  addOrder(order: Order) {
    //..
  },
  removeOrder(order: Order) {
    //..
  }
}

export const muttions = {
  addOrder(order: Order) {
    //..
  },
  removeOrder(order: Order) {
    //..
  }
}