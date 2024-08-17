import { reactive } from 'vue'
import type { AuthState } from './auth'
import type { MostroEvent } from '~/plugins/02-mostro'

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
  fiat_amount: number,
  fiat_code: string,
  id: string,
  payment_method: string,
  premium: number,
  buyer_pubkey: string,
  seller_pubkey: string
  master_buyer_pubkey?: string,
  master_seller_pubkey?: string,
}

type Peer = {
  pubkey: string
}

/**
 * Message sent by mostro
 */
export type MostroMessage = {
  order: {
    version: number,
    id: string,
    action: Action,
    content: {
      payment_request?: PaymentRequest,
      small_order?: SmallOrder,
      peer?: Peer,
      order?: Order,
      rating_user?: number
    },
    created_at: number
  },
  cant_do: {
    version: number,
    id: string,
    pubkey: string | null,
    action: Action.CantDo,
    content: {
      text_message: string,
    }
  }
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
  Order = 'order',
  NewOrder = 'new-order',
  TakeSell = 'take-sell',
  TakeBuy = 'take-buy',
  PayInvoice = 'pay-invoice',
  BuyerTookOrder = 'buyer-took-order',
  FiatSent = 'fiat-sent',
  FiatSentOk = 'fiat-sent-ok',
  WaitingSellerToPay = 'waiting-seller-to-pay',
  WaitingBuyerInvoice = 'waiting-buyer-invoice',
  AddInvoice = 'add-invoice',
  HoldInvoicePaymentAccepted = 'hold-invoice-payment-accepted',
  HoldInvoicePaymentSettled = 'hold-invoice-payment-settled',
  Release = 'release',
  Released = 'released',
  Cancel = 'cancel',
  PurchaseCompleted = 'purchase-completed',
  Rate = 'rate',
  RateUser = 'rate-user',
  RateReceived = 'rate-received',
  AdminTookDispute = 'admin-took-dispute',
  AdminCanceled = 'admin-canceled',
  AdminSettled = 'admin-settled',
  Dispute = 'dispute',
  DisputeInitiatedByYou = 'dispute-initiated-by-you',
  DisputeInitiatedByPeer = 'dispute-initiated-by-peer',
  CantDo = 'cant-do'
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
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  CANCELED_BY_ADMIN = 'canceled-by-admin',
  COMPLETED_BY_ADMIN = 'completed-by-admin',
  DISPUTE = 'dispute',
  EXPIRED = 'expired',
  FIAT_SENT = 'fiat-sent',
  SETTLE_HODL_INVOICE = 'settled-hold-invoice',
  PENDING = 'pending',
  SUCCESS = 'success',
  WAITING_BUYER_INVOICE = 'waiting-buyer-invoice',
  WAITING_PAYMENT = 'waiting-payment'
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
  min_amount: number | null
  max_amount: number | null
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
  updated_at?: number
  rating?: {
    value: number | undefined,
    confirmed: boolean | undefined
  }
  disputed: boolean = false
  mostro_id: string

  constructor(
    id: string,
    kind: OrderType,
    status: OrderStatus,
    fiat_code: string,
    min_amount: number | null,
    max_amount: number | null,
    fiat_amount: number,
    payment_method: string,
    premium: number,
    created_at: number,
    amount: number,
    mostro_id: string
  ) {
    this.id = id;
    this.kind = kind;
    this.status = status;
    this.fiat_code = fiat_code;
    this.min_amount = min_amount;
    this.max_amount = max_amount;
    this.fiat_amount = fiat_amount;
    this.payment_method = payment_method;
    this.premium = premium;
    this.created_at = created_at;
    this.amount = amount
    this.mostro_id = mostro_id
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
    if (order1?.min_amount !== order2?.min_amount) {
      return false
    }
    if (order1?.max_amount !== order2?.max_amount) {
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
  min_amount: number | null
  max_amount: number | null
  payment_method: string,
  premium: number,
  created_at: number,
  buyer_invoice?: string | null
}

export enum OrderPricingMode {
  MARKET = 'MARKET',
  FIXED = 'FIXED'
}

export const USER_ORDERS_KEY = 'user-orders-key'
export const NOTIFICATIONS_KEY = 'notifications-key'
export const AUTH_LOCAL_STORAGE_ENCRYPTED_KEY = 'encrypted-private-key'
export const AUTH_LOCAL_STORAGE_DECRYPTED_KEY = 'decrypted-private-key'

export interface OrderState {
  orders: typeof reactive<OrderMapType>,
  userOrders: OrderOwnershipMapType
}

export type OrderMapType = {
  [key: string]: Order
}

export type OrderOwnershipMapType = {
  [key: string]: boolean;
}

// Define the state type
export interface NotificationState {
  notifications: Notification[]
}

export interface Notification {
  timestamp: number,
  title: string,
  subtitle: string,
  orderId: string,
  orderStatus: OrderStatus,
  dismissed: boolean
}

export interface RootState {
  orders: {
    orders: Map<string, Order>;
    userOrders: OrderMapType;
  },
  notifications: {
    notifications: Notification[]
  }
  auth: AuthState
}
export interface ScheduledOrderUpdatePayload {
  orderId: string,
  event: MostroEvent,
  seller_pubkey?: string,
  buyer_pubkey?: string
}

export interface EncryptedPrivateKey {
  ciphertext: string,
  salt: string
}

export interface FiatData {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  emoji: string;
  name_plural: string;
  price: boolean;
}