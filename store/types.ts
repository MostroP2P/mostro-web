import { Order } from "./orders"

export type ThreadSummary = {
  orderId: string,
  order: Order,
  messageCount: number
}

// Mostro messages

type NullableOrder = Order | null
type PaymentRequest = [NullableOrder, string]
type InvoiceAccepted = {
  buyer: string,
  fiatAmount: number,
  fiatCode: string,
  paymentMethod: string
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
    InvoiceAccepted?: InvoiceAccepted,
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
  FiatSent = 'FiatSent',
  Release = 'Release',
  Cancel = 'Cancel',

  // Custom-non official action
  InvoiceAccepted = 'InvoiceAccepted',
  SaleCompleted = 'SaleCompleted'
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