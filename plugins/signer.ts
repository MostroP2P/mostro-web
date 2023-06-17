import { Store } from 'vuex'
import { RootState } from '../store/types'

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

/**
 * Browser extension implementing NIP-07
 */
export class ExtensionSigner extends BaseSigner {
  protected _type = SignerType.NIP07

  getPublicKey() {
    // @ts-ignore
    return window.nostr.getPublicKey()
  }
  signEvent(e: any) {
    // @ts-ignore
    return window.nostr.signEvent(e)
  }
  getRelays?(): Promise<Relays> {
    // @ts-ignore
    return window.nostr.getRelays() as Promise<Relays>
  }
  encrypt?(pubkey: string, plaintext: string) {
    // @ts-ignore
    return window.nostr.encrypt(pubkey, plaintext) as Promise<string>
  }
  decrypt?(pubkey: string, ciphertext: string) {
    // @ts-ignore
    return window.nostr.decrypt(pubkey, plaintext) as Promise<string>
  }
}

/**
 * Local signer that will use decrypted/unlocked private key
 * from the local storage to operate.
 */
export class LocalSigner extends BaseSigner {
  _type = SignerType.LOCAL
  _locked: boolean = true
  constructor(private store: Store<RootState>) {
    super()
  }

  get locked() {
    return this._locked
  }

  set locked(value: boolean) {
    this._locked = value
  }

  getPublicKey() {
    return new Promise<string>((resolve, reject) => {
      if (this.store.state.auth.nsec) {
        const { nsec } = this.store.state.auth
        const { nip19, getPublicKey } = window.NostrTools
        const secretHex = nip19.decode(nsec).data
        const publicKey = getPublicKey(secretHex)
        resolve(publicKey)
      } else {
        const { encryptedPrivateKey } = this.store.state.auth
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
        const { nip19, signEvent } = window.NostrTools
        const { nsec } = this.store.state.auth
        const secretHex = nip19.decode(nsec).data
        event.sig = signEvent(event, secretHex)
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
    const { nip04, nip19 } = window.NostrTools
    const destinationPubKey = pubkey.startsWith('npub') ? nip19.decode(pubkey).data : pubkey
    const { nsec } = this.store.state.auth
    const secretHex = nip19.decode(nsec).data
    return nip04.encrypt(secretHex, destinationPubKey, plaintext)
  }
  decrypt?(pubkey: string, ciphertext: string): Promise<string> {
    const { nip04, nip19 } = window.NostrTools
    const destinationPubKey = pubkey.startsWith('npub') ? nip19.decode(pubkey).data : pubkey
    const { nsec } = this.store.state.auth
    const secretHex = nip19.decode(nsec).data
    return nip04.decrypt(secretHex, destinationPubKey, ciphertext)
  }
}