import { describe, it, expect } from 'vitest';
import { Mostro } from '../../../../utils/mostro/index';
import { NDKEvent } from '@nostr-dev-kit/ndk'

const mockEvent = (overrides = {}) => {
  return {
    pubkey: 'mock_mostro_pubkey',
    created_at: 1700000000,
    tags: [
      ['mostro_version', '1.0.0'],
      ['mostro_commit_id', 'abc123'],
      ['max_order_amount', '1000'],
      ['min_order_amount', '10'],
      ['expiration_hours', '24'],
      ['expiration_seconds', '86400'],
      ['fee', '0.01'],
      ['hold_invoice_expiration_window', '3600'],
      ['invoice_expiration_window', '7200']
    ],
    ...overrides
  } as NDKEvent;
};

describe('Mostro.extractInfoFromEvent', () => {
  it('extracts info from ndk event', () => {
    const mostro = new Mostro({
      mostroPubKey: 'mock_mostro_pubkey',
      relays: 'wss://relay.example.com'
  });
    const event = mockEvent();
    expect(mostro.extractInfoFromEvent(event)).toEqual({
      mostro_pubkey: 'mock_mostro_pubkey',
      mostro_version: '1.0.0',
      mostro_commit_id: 'abc123',
      max_order_amount: 1000,
      min_order_amount: 10,
      expiration_hours: 24,
      expiration_seconds: 86400,
      fee: 0.01,
      hold_invoice_expiration_window: 3600,
      invoice_expiration_window: 7200,
      created_at: 1700000000
    });
  });
});
