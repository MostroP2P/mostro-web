import { describe, it, expect, vi, beforeEach } from 'vitest'
import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { generateSecretKey, getPublicKey, nip59 } from 'nostr-tools'
import { Nostr } from '../../../utils/nostr'
import { SigningMode } from '../../../utils/mostro'
import type { Action, MostroMessage } from '~/utils/mostro/types'

const MOSTRO_MESSAGES = {
  TAKE_SELL: {
    "order": {
      "version": 1,
      "id": "830f7ef9-c849-46a1-8807-18c189d8e04f",
      "trade_index": 1,
      "action": "take-sell",
      "payload": null
    }
  },
  FIAT_SENT: {
    "order": {
      "version": 1,
      "action": "fiat-sent",
      "payload": null
    }
  }
}

describe('Nostr', () => {
  let nostr: Nostr
  let mockNdk: NDK
  let identityPrivateKey: string
  let tradePrivateKey: string
  let mostroPubKey: string

  const createNostrEvent = () => {
    const event = new NDKEvent(mockNdk)
    event.kind = 1
    event.created_at = Math.floor(Date.now() / 1E3)
    return event
  }

  beforeEach(() => {
    // Generate test keys
    identityPrivateKey = Buffer.from(generateSecretKey()).toString('hex')
    tradePrivateKey = Buffer.from(generateSecretKey()).toString('hex')
    mostroPubKey = getPublicKey(generateSecretKey())

    const keyManager = new KeyManager()

    // Initialize Nostr instance
    nostr = new Nostr({
      relays: 'wss://test.relay',
      mostroPubKey: mostroPubKey,
      debug: false,
      keyProvider: keyManager
    })

    // Set up signers
    nostr.setIdentitySigner(identityPrivateKey)
    nostr.setTradeSigner(tradePrivateKey)

    // Mock NDK and its methods
    mockNdk = {
      publish: vi.fn().mockResolvedValue(new Set(['wss://test.relay'])),
    } as unknown as NDK

    // Mock the publishEvent method
    vi.spyOn(nostr, 'publishEvent').mockImplementation(async () => {})
  })

  describe('giftWrapAndPublishMostroEvent', () => {
    it('should use identity signer for the "take-sell" action', async () => {
      // Set up
      nostr.setSigningMode(SigningMode.INITIAL)
      const event = createNostrEvent()
      event.content = JSON.stringify(MOSTRO_MESSAGES.TAKE_SELL)

      // Create the spy BEFORE calling the function
      const publishSpy = vi.spyOn(nostr, 'publishEvent')

      // Execute the function
      const { rumor, seal, giftWrap } = await nostr.giftWrapAndPublishMostroEvent(event, mostroPubKey)

      // Assert that the event was published  
      expect(publishSpy).toHaveBeenCalled()

      // Assert that the rumor, seal, and giftWrap were created
      expect(rumor).toBeDefined()
      expect(seal).toBeDefined()
      expect(giftWrap).toBeDefined()

      // Assert that the giftWrap has the mostro pubkey in the tags
      expect(giftWrap.tags[0][1]).toBe(mostroPubKey)

      // Get the identity public key (derived from identityPrivateKey)
      const identityPubkey = getPublicKey(Buffer.from(identityPrivateKey, 'hex'))
      expect(seal.pubkey).toBe(identityPubkey)

      // Check that the first element of theunserialized rumor contents match the mostro message
      const rumorContent = JSON.parse(rumor.content)
      expect(rumorContent[0]).toEqual(MOSTRO_MESSAGES.TAKE_SELL)
    })

    it('should use trade signer for the "fiat-sent" action', async () => {
      // Set up
      nostr.setSigningMode(SigningMode.TRADE)
      const event = createNostrEvent()
      event.content = JSON.stringify(MOSTRO_MESSAGES.FIAT_SENT)

      // Get the published event through the spy
      const publishSpy = vi.spyOn(nostr, 'publishEvent')

      // Execute
      const { rumor, seal, giftWrap } = await nostr.giftWrapAndPublishMostroEvent(event, mostroPubKey)

      // Assert that the event was published  
      expect(publishSpy).toHaveBeenCalled()

      // Assert that the rumor, seal, and giftWrap were created
      expect(rumor).toBeDefined()
      expect(seal).toBeDefined()
      expect(giftWrap).toBeDefined()

      // The event should be encrypted with the identity key
      const tradePubKey = getPublicKey(Buffer.from(tradePrivateKey, 'hex'))
      expect(seal.pubkey).toBe(tradePubKey)
    })


    it('should throw error when appropriate signer is not available', async () => {
      const keyManager = new KeyManager()
      // Set up
      nostr = new Nostr({
        relays: 'wss://test.relay',
        mostroPubKey: mostroPubKey,
        debug: false,
        keyProvider: keyManager
      })
      const event = new NDKEvent(mockNdk)

      // Execute & Assert
      await expect(nostr.giftWrapAndPublishMostroEvent(event, mostroPubKey))
        .rejects
        .toThrow('No appropriate seal signer available')
    })

    it('should call the "createRumor", "createSeal", and "createWrap" functions in the correct order', async () => {
      // Set up
      nostr.setSigningMode(SigningMode.TRADE)
      const event = createNostrEvent()
      event.content = JSON.stringify(MOSTRO_MESSAGES.TAKE_SELL)

      // Mock the entire nip59 module
      vi.mock('nostr-tools', async () => {
        const actual = await vi.importActual<typeof import('nostr-tools')>('nostr-tools')
        return {
          ...actual,
          nip59: {
            createRumor: vi.fn(actual.nip59.createRumor),
            createSeal: vi.fn(actual.nip59.createSeal),
            createWrap: vi.fn(actual.nip59.createWrap)
          }
        }
      })

      // Execute
      await nostr.giftWrapAndPublishMostroEvent(event, mostroPubKey)

      // Verify the functions were called
      expect(nip59.createRumor).toHaveBeenCalled()
      expect(nip59.createSeal).toHaveBeenCalled()
      expect(nip59.createWrap).toHaveBeenCalled()

      // Verify order of calls (we need to access mock differently now)
      const rumorCalls = vi.mocked(nip59.createRumor).mock.invocationCallOrder
      const sealCalls = vi.mocked(nip59.createSeal).mock.invocationCallOrder
      const wrapCalls = vi.mocked(nip59.createWrap).mock.invocationCallOrder
      
      expect(rumorCalls[0]).toBeLessThan(sealCalls[0])
      expect(sealCalls[0]).toBeLessThan(wrapCalls[0])
    })
  })
}) 