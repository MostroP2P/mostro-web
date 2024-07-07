import { ref, computed } from 'vue'
import * as bolt11 from 'light-bolt11-decoder'
import bip21 from 'bip21'

const DEFAULT_MIN_EXPIRY = 300

type LightInvoiceSection = {
  letters: string
  name: string
  tag?: string
  value?: string | number | Object
}

type LightDecodedInvoice = {
  sections?: LightInvoiceSection[]
  expiry?: number
}

export interface InvoiceParams {
  minExpiry?: number
  expectedMsats?: bigint
}

export function useBolt11Parser() {
  const invoice = ref<string | undefined>(undefined)
  const amount = ref<string | undefined>(undefined)
  const timestamp = ref<number | undefined>(undefined)
  const expiry = ref<number | undefined>(undefined)
  const error = ref<string | undefined>(undefined)
  const sats = computed<bigint | undefined>(() => {
    if (!amount.value) {
      return undefined
    }
    return BigInt(amount.value) / BigInt(1E3)
  })
  const msats = computed<bigint | undefined>(() => {
    if (!amount.value) {
      return undefined
    }
    return BigInt(amount.value)
  })

  // Extending the Options type to include the lightning property
  type DecodedBip21 = {
    options?: {
      lightning?: string
    }
  }

  const parseInvoice = (candidate: string, params?: InvoiceParams) => {
    if (!candidate) {
      error.value = undefined
      return
    }
    // Attempt to decode a BIP21 URI
    try {
      const decodedBip21 = bip21.decode(candidate) as DecodedBip21
      if (decodedBip21 && decodedBip21.options && decodedBip21.options.lightning) {
        candidate = decodedBip21.options.lightning
      }
      // Don't do anything in case of error, most of the times the
      // 'invoice' variable won't contain a BIP21 URI
    } catch(err: unknown) {}
    try {
      const decodedInvoice: LightDecodedInvoice = bolt11.decode(candidate)
      amount.value = decodedInvoice.sections?.find((section) => section.name === 'amount')?.value as string
      timestamp.value = decodedInvoice.sections?.find((section) => section.name === 'timestamp')?.value as number
      expiry.value = decodedInvoice.sections?.find((section) => section.name === 'expiry')?.value as number
      invoice.value = candidate
      if (params) {
        if (params.minExpiry && expiry.value && expiry.value < params.minExpiry) {
          error.value = `Expiration time for invoice is too short, min ${params.minExpiry} secs, provided is ${expiry.value} secs`
        }
        if (params.expectedMsats && msats.value && msats.value !== params.expectedMsats) {
          const expected = Number(params.expectedMsats / BigInt(1E3))
          const provided = Number(msats.value / BigInt(1E3))
          error.value = `Amount mismatch, expected ${expected} sats, provided invoice is for ${provided} sats`
        }
      }
    } catch(err: unknown) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error while decoding invoice: ', err)
      }
      error.value = 'Error while decoding invoice'
    }
  }

  const validateAmount = (expectedMsats: bigint) => {
    if (!msats.value) {
      return 'No amount specified in the invoice'
    }
    if (msats.value !== BigInt(expectedMsats)) {
      error.value = `Expected amount is ${Number(expectedMsats / BigInt(1E3))} sats, but got ${Number(msats.value / BigInt(1E3))} sats`
    }
  }

  const isExpired = () => {
    if (!expiry.value) {
      return
    }
    if (timestamp.value && timestamp.value + expiry.value < Math.floor(Date.now() / 1E3)) {
      error.value = 'Invoice is expired'
    }
  }

  return {
    sats,
    msats,
    timestamp,
    expiry,
    error,
    invoice,
    parseInvoice,
    validateAmount,
    isExpired,
  }
}