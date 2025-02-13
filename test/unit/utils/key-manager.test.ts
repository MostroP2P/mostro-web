import { describe, it, expect, beforeEach } from 'vitest';
import { KeyManager, TradeKeysDatabase } from '../../../utils/key-manager';


describe('KeyManager', () => {
  let keyManager: KeyManager;
  let db: TradeKeysDatabase;

  beforeEach(async () => {
    db = new TradeKeysDatabase();
    keyManager = new KeyManager();
    await keyManager.init(
      'tomato tomato tomato tomato tomato tomato tomato tomato tomato tomato tomato tomato'
    );

    await db.tradeKeys.clear();
  });

  describe('getNextAvailableKey', () => {
    describe('without keys', () => {
      it('returns key with index 1', async () => {
        const key = await keyManager.getNextAvailableKey();
        expect(key.keyIndex).toBe(1);
      });
    });

    describe('with unassigned keys', () => {
      beforeEach(async () => {
        await db.tradeKeys.add({ orderId: '', keyIndex: 3, derivedKey: 'dummy', createdAt: Date.now() });
      });

      it('returns key index of the first unassigned key', async () => {
        const key = await keyManager.getNextAvailableKey();
        expect(key.keyIndex).toBe(3);
      });
    });

    describe('without unassigned keys', () => {
      beforeEach(async () => {
        await db.tradeKeys.add({ orderId: 'some-order', keyIndex: 1, derivedKey: 'dummy', createdAt: Date.now() });
      });

      it('throws an error', async () => {
        await expect(keyManager.getNextAvailableKey()).rejects.toThrow('No available keys in pool');
      });
    });
  });
});
