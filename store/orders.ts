export enum OrderType {
  BUY = 'Buy',
  SELL = 'Sell'
}

export enum OrderStatus {
  PENDING = 'Pending',
  // TODO: Get all possible order states
}

export interface Order {
  id: string,
  kind: OrderType,
  status: OrderStatus
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