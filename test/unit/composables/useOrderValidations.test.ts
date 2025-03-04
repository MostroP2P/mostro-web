import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrderValidations } from '../../../composables/useOrderValidations'
import { useMostroStore } from '../../../stores/mostro'

describe('useOrderValidations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('validateAmount', () => {
    describe('with mostro limits', () => {
      beforeEach(() => {
        const mostroStore = useMostroStore()
        mostroStore.addMostroInfo({
          mostro_pubkey: 'test-pubkey',
          created_at: 1739627993,
          expiration_hours: 24,
          expiration_seconds: 900,
          fee: 0.01,
          hold_invoice_expiration_window: 300,
          invoice_expiration_window: 300,
          max_order_amount: 1000000,
          min_order_amount: 100,
          mostro_commit_id: 'test-commit-id',
          mostro_version: '0.13.0'
        })
      });

      describe('when amount is negative', () => {
        it('returns minimum error message', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('-100')).toBe('Minimum order sats amount is 100')
        });
      });

      describe('when amount is zero', () => {
        it('returns minimum error message', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('0')).toBe('Minimum order sats amount is 100')
        });
      });

      describe('when amount is above max limit', () => {
        it('returns maximum error message', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('1000001')).toBe('Maximum order sats amount is 1000000')
        })
      });

      describe('when amount is below min limit', () => {
        it('returns minimum error message', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('99')).toBe('Minimum order sats amount is 100')
        })
      });

      describe('when amount is within limits', () => {
        it('returns true', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('500000')).toBe(true)
        })
      });

      describe('when amount equals min limit', () => {
        it('returns true', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('100')).toBe(true)
        });
      });

      describe('when amount equals max limit', () => {
        it('returns true', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('1000000')).toBe(true)
        });
      });
    });

    describe('without mostro limits', () => {
      describe('when amount is negative', () => {
        it('returns required field error message', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('-100')).toBe('Sats amount is required')
        });
      });

      describe('when amount is zero', () => {
        it('returns required field error message', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('0')).toBe('Sats amount is required')
        });
      });

      describe('with small amount', () => {
        it('returns true', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('1')).toBe(true)
        });
      });

      describe('with big amount', () => {
        it('returns true', () => {
          const { validateAmount } = useOrderValidations()
          expect(validateAmount('100000000')).toBe(true)
        });
      });
    })
  })
}) 
