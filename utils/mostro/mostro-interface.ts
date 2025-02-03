import { NDKEvent } from '@nostr-dev-kit/ndk'
import type { Listener } from 'tseep'
import { Nostr } from '../nostr'
import { Action, type NewOrder, type Order, type MostroInfo, type MostroMessage } from './types'
import type { GiftWrap, Rumor, Seal } from '../nostr/types'

// Event definitions
export interface MostroEvents {
  'ready': () => void
  'order-update': (order: Order, ev: NDKEvent) => void
  'info-update': (info: MostroInfo) => void
  'mostro-message': (message: MostroMessage, ev: NDKEvent) => void
  'peer-message': (gift: GiftWrap, seal: Seal, rumor: Rumor) => void
  [key: string]: Listener
  [key: symbol]: Listener
}
export enum PublicKeyType {
  HEX = 'hex',
  NPUB = 'npub'
}

export interface IMostro {
  // Connection methods
  connect(): Promise<void>
  
  // Order-related methods
  submitOrder(order: NewOrder): Promise<MostroMessage>
  takeSell(order: Order, amount?: number): Promise<MostroMessage>
  takeBuy(order: Order, amount?: number): Promise<MostroMessage>
  addInvoice(order: Order, invoice: string, amount?: number | null): Promise<MostroMessage>
  release(order: Order): Promise<MostroMessage>
  fiatSent(order: Order): Promise<MostroMessage>
  rateUser(order: Order, rating: number): Promise<MostroMessage>
  dispute(order: Order): Promise<MostroMessage>
  cancel(order: Order): Promise<MostroMessage>
  
  // Message-related methods
  submitDirectMessageToPeer(message: string, destination: string, tags: string[][]): Promise<void>
  waitForAction(action: Action, orderId: string, timeout?: number): Promise<MostroMessage>
  
  // Utility methods
  getMostroPublicKey(type?: PublicKeyType): string
  updateMnemonic(mnemonic: string): void
  getNostr(): Nostr
}