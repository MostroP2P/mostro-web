import { describe, it, expect, beforeEach } from 'vitest'
import { decode } from 'light-bolt11-decoder'
import { useBolt11Parser } from '../../composables/useInvoice'

// Valid invoice for 3K sats
const VALID_INVOICE = 'lnbcrt30u1pn96xx7pp5vgnz7kve2epjj9qakpvyv8e8ljyugxnvv0p055tuq2lvu0j0aq8qdqvd4ujqmt9d4hscqzzsxqyz5vqsp5klh79s03zexar9fwmqhcjw94ycq34fewgs69gcumyksaw2yqujes9qyyssqqx029tduuw583925u9ywp777xaytl96e84plrajwzrfrauu8kxmjwkawcz54sxs29flswjgphj7qlqpzkdl35wak62mmgzf8kf0jndqqqp3767'
// Valid invoice with no amount
const AMOUNTLESS_INVOICE = 'lnbcrt1pn96zawpp57snpvhjklcss7t2f8rrncr72fvheyxxa0lfks0pjgkaul02pxfwqdqqcqzzsxqyz5vqsp5y5p84w6uhnrlvvej4yc0fzwk7l40wzp4gstjkadtdg2wd8a22zms9qyyssqz3ew888k0ux9skldwpy5pl8v49a8s3v86vq03hftc4ylzqzhkqcpzgxpanmxgudw8ryc4gwwfyfvtevk5g9vs9dd78jmpcw4c07yr4gqfankyx'
// Valid invoice with expiration time too short
const EXPIRATION_TOO_SHORT_INVOICE = 'lnbcrt30u1pn96xstpp5dc4rwsgswnafrc5wuj4qhueg5zqsj3s22nqan8tjey8jvympqg9qdqqcqzzsxqp2sp5pqj2h3l64edhqz5ec4t24xmal4utnqtpf4mvtd57ksmmh8lcrfes9qyyssqtcqz8ljxjrrxld4mm0ux5dh9v82ryk253m9fra3xtvvchesmc5unv2lpkpgcny2yenegpwwdkjkevqsgvf6nxskm5g99thltu9g5upgp7texmd'
// Not an invoice
const NOT_AN_INVOICE = 'not_an_invoice'

// Minimum expiration time
const MIN_EXPIRATION_TIME = 300

describe('useInvoice', () => {
  let composable: ReturnType<typeof useBolt11Parser>

  beforeEach(() => {
    composable = useBolt11Parser()
  })
  
  it('parses a valid invoice', () => {
    composable.parseInvoice(VALID_INVOICE)
    expect(composable.msats.value).toBe(BigInt(3000000))
    expect(composable.timestamp.value).toBe(1717377246)
    expect(composable.expiry.value).toBe(86400)
    expect(composable.error.value).toBe(undefined)
  })
  it('parses a valid invoice, but with an unexpected amount', () => {
    const params = { expectedMsats: BigInt(1000) }
    composable.parseInvoice(VALID_INVOICE, params)
    expect(composable.error.value).toBe('Amount mismatch, expected 1 sats, provided invoice is for 3000 sats')
  })
  it('parses a valid invoice, but with a an expiration time that is too short', () => {
    const params = { minExpiry: MIN_EXPIRATION_TIME }
    composable.parseInvoice(EXPIRATION_TOO_SHORT_INVOICE, params)
    expect(composable.error.value).toBe('Expiration time for invoice is too short, min 300 secs, provided is 10 secs')
  })
  it('parses an invoice with no amount', () => {
    const params = { expectedMsats: BigInt(1000) }
    composable.parseInvoice(AMOUNTLESS_INVOICE, params)
    expect(composable.msats.value).toBe(undefined)
    expect(composable.timestamp.value).toBe(1717373870)
    expect(composable.expiry.value).toBe(86400)
    expect(composable.error.value).toBe(undefined)
  })
  it('sets no error when parsing an empty string', () => {
    composable.parseInvoice('')
    expect(composable.error.value).toBe(undefined)
  })
  it('fails to parse a random string', () => {
    composable.parseInvoice(NOT_AN_INVOICE)
    expect(composable.msats.value).toBe(undefined)
    expect(composable.timestamp.value).toBe(undefined)
    expect(composable.expiry.value).toBe(undefined)
    expect(composable.error.value).toBe('Error while decoding invoice')
  })
})