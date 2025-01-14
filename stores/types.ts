import { reactive } from 'vue'
import type { AuthState } from './auth'
import type { Order } from '~/utils/mostro/types'
import type { NDKEvent } from '@nostr-dev-kit/ndk'

export type ThreadSummary = {
  orderId: string,
  order: Order,
  messageCount: number
}

/**
 * Text message sent by mostro
 */
export type TextMessage = {
  text: string,
  created_at: number
}

// Peer messages
export type PeerThreadSummary = {
  peer: string,
  lastMessage: ChatMessage,
  messageCount: number
}

export type ChatMessage = {
  id: string,
  peerNpub: string,
  sender: 'me' | 'other',
  created_at: number,
  text: string
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

export enum DisputeStatus {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in-progress',
  SETTLED = 'settled-by-admin',
  CANCELED = 'seller-refunded'
}

export interface Dispute {
  id: string,
  orderId: string,
  createdAt: number,
  status: DisputeStatus
}

export interface DisputeStore {
  byId: { [disputeId: string]: Dispute };
  byOrderId: { [orderId: string]: Dispute };
}