import { vi, describe, beforeEach, it, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMostroStore } from '../../../stores/mostro';

const mostroMock = { on: vi.fn() };
vi.stubGlobal("useNuxtApp", () => ({
  $mostro: mostroMock,
}));

describe('useMostroStore', () => {

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('nuxtClientInit', () => {
    it('subscribes to info-update event', () => {
      const mostroStore = useMostroStore();
      mostroStore.nuxtClientInit();
      expect(mostroMock.on).toHaveBeenCalledWith('info-update', expect.any(Function));
    });
    it('saves intial mostro info', () => {
      const mostroInfo = {
        mostro_pubkey: 'test-pubkey',
        created_at: 1739627995,
        expiration_hours: 24,
        expiration_seconds: 900,
        fee: 0.01,
        hold_invoice_expiration_window: 300,
        invoice_expiration_window: 300,
        max_order_amount: 1000000,
        min_order_amount: 100,
        mostro_commit_id: 'test-commit-id',
        mostro_version: '0.14.0',
      };

      const callback = mostroMock.on.mock.calls.find(call => call[0] === 'info-update')?.[1];
      callback(mostroInfo);
      const mostroStore = useMostroStore();
      mostroStore.nuxtClientInit();
      expect(mostroStore.getMostroInfo('test-pubkey')).toEqual(mostroInfo);
    });
    it('updates mostro info', () => {
      const firstMostroInfo = {
        mostro_pubkey: 'test-pubkey',
        created_at: 1739627995,
        expiration_hours: 24,
        expiration_seconds: 900,
        fee: 0.01,
        hold_invoice_expiration_window: 300,
        invoice_expiration_window: 300,
        max_order_amount: 1000000,
        min_order_amount: 100,
        mostro_commit_id: 'test-commit-id',
        mostro_version: '0.14.0',
      };
      const secondMostroInfo = {
        mostro_pubkey: 'test-pubkey',
        created_at: 1739627996,
        expiration_hours: 25,
        expiration_seconds: 950,
        fee: 0.015,
        hold_invoice_expiration_window: 350,
        invoice_expiration_window: 350,
        max_order_amount: 2000000,
        min_order_amount: 200,
        mostro_commit_id: 'second-test-commit-id',
        mostro_version: '0.14.1',
      };

      const callback = mostroMock.on.mock.calls.find(call => call[0] === 'info-update')?.[1];
      callback(firstMostroInfo);
      callback(secondMostroInfo);
      const mostroStore = useMostroStore();
      mostroStore.nuxtClientInit();
      expect(mostroStore.getMostroInfo('test-pubkey')).toEqual(secondMostroInfo);
    });
    it('does not update mostro info if event is older', () => {
      const firstMostroInfo = {
        mostro_pubkey: 'test-pubkey',
        created_at: 1739627998,
        expiration_hours: 24,
        expiration_seconds: 900,
        fee: 0.01,
        hold_invoice_expiration_window: 300,
        invoice_expiration_window: 300,
        max_order_amount: 1000000,
        min_order_amount: 100,
        mostro_commit_id: 'test-commit-id',
        mostro_version: '0.14.0',
      };
      const secondMostroInfo = {
        mostro_pubkey: 'test-pubkey',
        created_at: 1739627997,
        expiration_hours: 25,
        expiration_seconds: 950,
        fee: 0.015,
        hold_invoice_expiration_window: 350,
        invoice_expiration_window: 350,
        max_order_amount: 2000000,
        min_order_amount: 200,
        mostro_commit_id: 'second-test-commit-id',
        mostro_version: '0.14.1',
      };

      const callback = mostroMock.on.mock.calls.find(call => call[0] === 'info-update')?.[1];
      callback(firstMostroInfo);
      callback(secondMostroInfo);
      const mostroStore = useMostroStore();
      mostroStore.nuxtClientInit();
      expect(mostroStore.getMostroInfo('test-pubkey')).toEqual(firstMostroInfo);
    });
  });

  describe('getMostroInfo', () => {
    describe('without mostro info', () => {
      it ('getMostroInfo returns undefined', () => {
        const mostroStore = useMostroStore()
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toBeUndefined()
      });
    });

    describe('with mostro info', () => {
      let mostroStore: ReturnType<typeof useMostroStore>;
  
      beforeEach(() => {
        mostroStore = useMostroStore()
        mostroStore.addMostroInfo({
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        });
        mostroStore.addMostroInfo({
          mostro_pubkey: 'another-mostro-pubkey',
          created_at: 1739627994,
          expiration_hours: 48,
          expiration_seconds: 1000,
          fee: 0.05,
          hold_invoice_expiration_window: 500,
          invoice_expiration_window: 500,
          max_order_amount: 5000000,
          min_order_amount: 500,
          mostro_commit_id: 'another-mostro-commit-id',
          mostro_version: '0.12.0'
        });
      });
      it ('returns info of expected mostro', () => {
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toEqual({
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        });
      });

      it ('returns info of expected mostro', () => {
        expect(mostroStore.getMostroInfo('another-mostro-pubkey')).toEqual({
          mostro_pubkey: 'another-mostro-pubkey',
          created_at: 1739627994,
          expiration_hours: 48,
          expiration_seconds: 1000,
          fee: 0.05,
          hold_invoice_expiration_window: 500,
          invoice_expiration_window: 500,
          max_order_amount: 5000000,
          min_order_amount: 500,
          mostro_commit_id: 'another-mostro-commit-id',
          mostro_version: '0.12.0'
        });
      });
  
      it ('returns undefined if mostro key is not present', () => {
        expect(mostroStore.getMostroInfo('missing-mostro-pubkey')).toBeUndefined();
      });
    });
  });

  describe('listMostroKeys', () => {
    describe('without mostro info', () => {
      it('listMostroKeys returns empty array', () => {
        const mostroStore = useMostroStore()
        expect(mostroStore.listMostroKeys()).toEqual([]);
      });
    });

    describe('with mostro info', () => {
      let mostroStore: ReturnType<typeof useMostroStore>;
  
      beforeEach(() => {
        mostroStore = useMostroStore()
        mostroStore.addMostroInfo({
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        });
        mostroStore.addMostroInfo({
          mostro_pubkey: 'another-mostro-pubkey',
          created_at: 1739627994,
          expiration_hours: 48,
          expiration_seconds: 1000,
          fee: 0.05,
          hold_invoice_expiration_window: 500,
          invoice_expiration_window: 500,
          max_order_amount: 5000000,
          min_order_amount: 500,
          mostro_commit_id: 'another-mostro-commit-id',
          mostro_version: '0.12qq.0'
        });
      });  
      it('listMostroKeys returns all mostro keys', () => {
        expect(mostroStore.listMostroKeys()).toEqual(
          ['my-mostro-pubkey', 'another-mostro-pubkey']
        );
      });
    });
  });

  describe('addMostroInfo', () => {
    describe('without mostro info', () => {
      it('addMostroInfo adds mostro info', () => {
        const mostroStore = useMostroStore();
        const newMostroInfo = {
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        };
        mostroStore.addMostroInfo(newMostroInfo);
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toEqual(newMostroInfo);
      });
    });

    describe('with mostro info', () => {
      let mostroStore: ReturnType<typeof useMostroStore>;

      beforeEach(() => {
        mostroStore = useMostroStore()
        mostroStore.addMostroInfo({
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        });
      });

      it('s new mostro info', () => {
        const newMostroInfo = {
          mostro_pubkey: 'another-mostro-pubkey',
          created_at: 1739627994,expiration_hours: 48,
          expiration_seconds: 1000,
          fee: 0.05,
          hold_invoice_expiration_window: 500,
          invoice_expiration_window: 500,
          max_order_amount: 5000000,
          min_order_amount: 500,
          mostro_commit_id: 'another-mostro-commit-id',
          mostro_version: '0.12.0'
        };
        expect(mostroStore.getMostroInfo('another-mostro-pubkey')).toBeUndefined();
        mostroStore.addMostroInfo(newMostroInfo);
        expect(mostroStore.getMostroInfo('another-mostro-pubkey')).toEqual(newMostroInfo);
      });

      it('updates existing mostro info if created at is newer', () => {
        const newMostroInfo = {
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627994,
          expiration_hours: 25,
          expiration_seconds: 300,
          fee: 0.03,
          hold_invoice_expiration_window: 900,
          invoice_expiration_window: 900,
          max_order_amount: 3000000,
          min_order_amount: 300,
          mostro_commit_id: 'latest-mostro-commit-id',
          mostro_version: '0.13.1'
        };
        mostroStore.addMostroInfo(newMostroInfo);
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toEqual(newMostroInfo);
      });

      it('does not update if created at is older than existing mostro info', () => {
        const newMostroInfo = {
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627990,
          expiration_hours: 23,
          expiration_seconds: 100,
          fee: 0.02,
          hold_invoice_expiration_window: 800,
          invoice_expiration_window: 800,
          max_order_amount: 2000000,
          min_order_amount: 200,
          mostro_commit_id: 'old-mostro-commit-id',
          mostro_version: '0.12.9'
        };
        mostroStore.addMostroInfo(newMostroInfo);
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toEqual({
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        });
      });
    });
  });

  describe('removeMostroInfo', () => {
    describe('without mostro info', () => {
      it('removeMostroInfo does nothing', () => {
        const mostroStore = useMostroStore()
        mostroStore.removeMostroInfo('my-mostro-pubkey')
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toBeUndefined()
      });
    });

    describe('with mostro info', () => {
      let mostroStore: ReturnType<typeof useMostroStore>;

      beforeEach(() => {
        mostroStore = useMostroStore()
        mostroStore.addMostroInfo({
          mostro_pubkey: 'my-mostro-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'my-mostro-commit-id',
          mostro_version: '0.13.0'
        });
        mostroStore.addMostroInfo({
          mostro_pubkey: 'another-mostro-pubkey',
          created_at: 1739627994,
          expiration_hours: 48,
          expiration_seconds: 1000,
          fee: 0.05,
          hold_invoice_expiration_window: 500,
          invoice_expiration_window: 500,
          max_order_amount: 5000000,
          min_order_amount: 500,
          mostro_commit_id: 'another-mostro-commit-id',
          mostro_version: '0.12.0'
        });
      });
      it('removeMostroInfo removes mostro info', () => {
        mostroStore.removeMostroInfo('my-mostro-pubkey')
        expect(mostroStore.getMostroInfo('my-mostro-pubkey')).toBeUndefined()
      });
  
      it('removeMostroInfo does not remove other mostro info', () => {
        mostroStore.removeMostroInfo('my-mostro-pubkey')
        expect(mostroStore.getMostroInfo('another-mostro-pubkey')).toEqual({
          mostro_pubkey: 'another-mostro-pubkey',
          created_at: 1739627994,
          expiration_hours: 48,
          expiration_seconds: 1000,
          fee: 0.05,
          hold_invoice_expiration_window: 500,
          invoice_expiration_window: 500,
          max_order_amount: 5000000,
          min_order_amount: 500,
          mostro_commit_id: 'another-mostro-commit-id',
          mostro_version: '0.12.0'
        });
      });
    });
  });
})
