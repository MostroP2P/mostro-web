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
  NotAllowedByStatus = 'not-allowed-by-status',
  PaymentFailed = 'payment-failed',
  OutOfRangeSatsAmount = 'out-of-range-sats-amount',
  CantDo = 'cant-do'
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
  disputed?: boolean = false
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

export type NewOrder = Pick<Order, 'kind' | 'status' | 'amount' | 'fiat_code' | 'fiat_amount' | 'min_amount' | 'max_amount' | 'payment_method' | 'premium' | 'created_at' | 'buyer_invoice'>

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

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell'
}

export interface MostroInfo {
  mostro_pubkey: string
  mostro_version: string
  mostro_commit_id: string
  max_order_amount: number
  min_order_amount: number
  expiration_hours: number
  expiration_seconds: number
  fee: number
  hold_invoice_expiration_window: number
  invoice_expiration_window: number
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
    request_id?: number,
    action: Action,
    content: {
      payment_request?: PaymentRequest,
      small_order?: SmallOrder,
      peer?: Peer,
      order?: Order,
      rating_user?: number
      dispute?: string
    },
    created_at: number
  },
  ['cant-do']: {
    version: number,
    id: string,
    request_id?: number,
    pubkey: string | null,
    action: Action.CantDo,
    content: {
      text_message: string,
    }
  }
  created_at: number
}