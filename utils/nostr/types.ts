import type { NDKEvent } from '@nostr-dev-kit/ndk'
import type { NostrEvent, UnsignedEvent } from 'nostr-tools'

export type GiftWrap = NDKEvent
export type Rumor = UnsignedEvent & {id: string}
export type Seal = NostrEvent
export type UnwrappedEvent = { gift: GiftWrap, rumor: Rumor, seal: Seal }
