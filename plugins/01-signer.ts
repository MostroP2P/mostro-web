import { nip04, nip19, getPublicKey, getSignature } from 'nostr-tools'
import { useAuth } from '@/stores/auth'

export interface Relays {
  [url: string]: { read: boolean; write: boolean }
}

export enum SignerType {
  NIP07,
  LOCAL
}

/**
 * Another name for the interface defined in NIP-07
 */
export abstract class BaseSigner {
  protected abstract _type: SignerType
  abstract getPublicKey(): Promise<string> 
  abstract signEvent(e: any): Promise<any>
  getRelays?(): Promise<Relays>
  encrypt?(pubkey: string, plaintext: string): Promise<string>
  decrypt?(pubkey:string, ciphertext: string): Promise<string>

  public get type() {
    return this._type
  }
  public set type(value) {
    this._type = value
  }
}

let sharedLock = Promise.resolve()

function Locked(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    sharedLock = sharedLock
      .then(() => {
        return originalMethod.apply(this, args)
      })
      .catch(() => { })

    return sharedLock
  }

  return descriptor
}

/**
 * Browser extension implementing NIP-07
 */
export class ExtensionSigner extends BaseSigner {
  protected _type = SignerType.NIP07

  // @ts-ignore
  @Locked
  getPublicKey() {
    // @ts-ignore
    return window.nostr.getPublicKey()
  }
  // @ts-ignore
  @Locked
  signEvent(e: any) {
    // @ts-ignore
    return window.nostr.signEvent(e)
  }
  // @ts-ignore
  @Locked
  getRelays?(): Promise<Relays> {
    // @ts-ignore
    return window.nostr.getRelays() as Promise<Relays>
  }
  // @ts-ignore
  @Locked
  encrypt?(pubkey: string, plaintext: string) {
    // @ts-ignore
    return window.nostr.nip04.encrypt(pubkey, plaintext) as Promise<string>
  }
  // @ts-ignore
  @Locked
  decrypt?(pubkey: string, ciphertext: string) {
    // @ts-ignore
    return window.nostr.nip04.decrypt(pubkey, ciphertext) as Promise<string>
  }
}

/**
 * Local signer that will use decrypted/unlocked private key
 * from the local storage to operate.
 */
export class LocalSigner extends BaseSigner {
  _type = SignerType.LOCAL
  _locked: boolean = true
  private store: ReturnType<typeof useAuth>
  constructor() {
    super()
    this.store = useAuth()
  }

  get locked() {
    return this._locked
  }

  set locked(value: boolean) {
    this._locked = value
  }

  getPublicKey() {
    return new Promise<string>((resolve, reject) => {
      if (this.store.nsec) {
        const { nsec } = this.store
        const secretHex = nip19.decode(nsec).data
        const publicKey = getPublicKey(secretHex)
        resolve(publicKey)
      } else {
        const { encryptedPrivateKey } = this.store
        if (encryptedPrivateKey) {
          reject('Private key is locked')
        } else {
          reject('Local signer was not set up')
        }
      }
    })
  }
  signEvent(event: any) {
    return new Promise((resolve, reject) => {
      try {
        const { nsec } = this.store
        const secretHex = nip19.decode(nsec).data
        event.sig = getSignature(event, secretHex)
        resolve(event)
      } catch(err) {
        console.error('Error in LocalSigner. err: ', err)
        reject(err)
      }
    })
  }
  getRelays(): Promise<Relays> {
    throw new Error('Method not implemented.');
  }
  encrypt?(pubkey: string, plaintext: string): Promise<string> {
    const destinationPubKey = pubkey.startsWith('npub') ? nip19.decode(pubkey).data : pubkey
    const { nsec } = this.store
    const secretHex = nip19.decode(nsec).data
    return nip04.encrypt(secretHex, destinationPubKey, plaintext)
  }
  decrypt?(pubkey: string, ciphertext: string): Promise<string> {
    const destinationPubKey = pubkey.startsWith('npub') ? nip19.decode(pubkey).data : pubkey
    const { nsec } = this.store
    const secretHex = nip19.decode(nsec).data
    return nip04.decrypt(secretHex, destinationPubKey, ciphertext)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('localSigner', new LocalSigner())
})