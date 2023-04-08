import { Order } from "./orders"

export type ThreadSummary = {
  orderId: string,
  order: Order,
  messageCount: number
}