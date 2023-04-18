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
    Peer?: Peer
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
  AddInvoice = 'AddInvoice',
  HoldInvoicePaymentSettled = 'HoldInvoicePaymentSettled',
  Release = 'Release',
  Cancel = 'Cancel'
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

export interface Order {
  id: string,
  kind: OrderType,
  status: OrderStatus,
  amount: number,
  fiat_code: string,
  fiat_amount: number,
  payment_method: string,
  premium: number,
  created_at: number,
  buyer_pubkey?: string,
  seller_pubkey?: string
}