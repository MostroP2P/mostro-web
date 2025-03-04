import { useMostroStore } from '@/stores/mostro'

export const useOrderValidations = () => {
  const mostroStore = useMostroStore()

  const validateAmount = (v: string) => {
    const amount = Number(v);
    const minOrderAmount = mostroStore.getDefaultMinOrderAmount();
    const maxOrderAmount = mostroStore.getDefaultMaxOrderAmount();
    if (minOrderAmount && amount < minOrderAmount) {
      return `Minimum order sats amount is ${minOrderAmount}`
    } else if (amount <= 0) {
      return 'Sats amount is required'
    } else if (maxOrderAmount && amount > maxOrderAmount) {
      return `Maximum order sats amount is ${maxOrderAmount}`
    }

    return true
  }

  return {
    validateAmount,
  }
} 
