export type ThreadSummary = {
  orderId: string,
  order: Order,
  messageCount: number
}

// Mostro messages

type NullableOrder = Order | null
type PaymentRequest = [NullableOrder, string]

export type SmallOrder = {
  amount: number,
  buyer_pubkey: string,
  fiat_amount: number,
  fiat_code: string,
  id: string,
  payment_method: string,
  premium: number,
  seller_pubkey: string
}

type Peer = {
  pubkey: string
}

/**
 * Message sent by mostro
 */
export type MostroMessage = {
  version: number,
  order_id: string,
  action: Action,
  content: {
    PaymentRequest?: PaymentRequest,
    SmallOrder?: SmallOrder,
    Peer?: Peer,
    Order?: Order
  },
  created_at: number
}

/**
 * Text message sent by mostro
 */
export type TextMessage = {
  text: string,
  created_at: number
}

export enum Action {
  Order = 'Order',
  TakeSell = 'TakeSell',
  TakeBuy = 'TakeBuy',
  PayInvoice = 'PayInvoice',
  BuyerTookOrder = 'BuyerTookOrder',
  FiatSent = 'FiatSent',
  WaitingSellerToPay = 'WaitingSellerToPay',
  WaitingBuyerInvoice = 'WaitingBuyerInvoice',
  AddInvoice = 'AddInvoice',
  HoldInvoicePaymentAccepted = 'HoldInvoicePaymentAccepted',
  HoldInvoicePaymentSettled = 'HoldInvoicePaymentSettled',
  Release = 'Release',
  Cancel = 'Cancel',
  PurchaseCompleted = 'PurchaseCompleted',
  RateUser = 'RateUser',
  CantDo = 'CantDo'
}

// Peer messages
export type PeerThreadSummary = {
  peer: string,
  lastMessage: PeerMessage,
  messageCount: number
}

export type PeerMessage = {
  id: string,
  peerNpub: string,
  sender: 'me' | 'other',
  created_at: number,
  text: string
}

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

/**
 * An order coming from the server
 */
export class Order {
  id: string
  kind: OrderType
  status: OrderStatus
  amount?: number
  fiat_code: string
  fiat_amount: number
  payment_method: string
  premium: number
  created_at: number
  buyer_pubkey?: string
  seller_pubkey?: string
  buyer_invoice?: string
  master_seller_pubkey?: string
  master_buyer_pubkey?: string
  is_mine?: boolean = false

  constructor(
    id: string,
    kind: OrderType,
    status: OrderStatus,
    fiat_code: string,
    fiat_amount: number,
    payment_method: string,
    premium: number,
    created_at: number
  ) {
    this.id = id;
    this.kind = kind;
    this.status = status;
    this.fiat_code = fiat_code;
    this.fiat_amount = fiat_amount;
    this.payment_method = payment_method;
    this.premium = premium;
    this.created_at = created_at;
  }
  static deepEqual(order1: Order | NewOrder, order2: Order): boolean {

    if (order1?.kind !== order2?.kind) {
      return false
    }
    if (order1?.amount !== order2?.amount) {
      return false
    }
    if (order1?.fiat_code !== order2?.fiat_code) {
      return false
    }
    if (order1?.fiat_amount !== order2?.fiat_amount) {
      return false
    }
    if (order1?.payment_method !== order2?.payment_method) {
      return false
    }
    if (order1?.premium !== order2?.premium) {
      return false
    }
    return true;
  }
}

/**
 * A new order being proposed by this client
 */
export interface NewOrder {
  kind: OrderType,
  status: OrderStatus,
  amount?: number,
  fiat_code: string,
  fiat_amount: number,
  payment_method: string,
  premium: number,
  buyer_invoice?: string
}

export enum OrderPricingMode {
  MARKET = 'MARKET',
  FIXED = 'FIXED'
}

export const USER_ORDERS_KEY = 'user-orders-key'

export interface OrderState {
  orders: Map<string, Order>,
  userOrders: OrderMapType
}

export type OrderMapType = {
  [key: string]: boolean;
}

export interface RootState {
  orders: {
    orders: Map<string, Order>;
    userOrders: OrderMapType;
  };
  // other modules...
}