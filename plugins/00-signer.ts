import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk'
import { nip04, nip19, getPublicKey, getSignature } from 'nostr-tools'
import type { UnsignedEvent } from 'nostr-tools'
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
// export abstract class BaseSigner {
//   protected abstract _type: SignerType
//   abstract getPublicKey(): Promise<string> 
//   abstract signEvent(e: any): Promise<any>
//   getRelays?(): Promise<Relays>
//   encrypt?(pubkey: string, plaintext: string): Promise<string>
//   decrypt?(pubkey:string, ciphertext: string): Promise<string>

//   public get type() {
//     return this._type
//   }
//   public set type(value) {
//     this._type = value
//   }
// }

/**
 * Browser extension implementing NIP-07
 */
// export class ExtensionSigner extends BaseSigner {
//   protected _type = SignerType.NIP07
//   protected static sharedLock: Promise<void> = Promise.resolve();

//   getPublicKey() {
//     return ExtensionSigner.sharedLock
//       .then(() => {
//         // @ts-ignore
//         return window.nostr.getPublicKey();
//       })
//       .catch((error) => {
//         // Throw an error if necessary
//         throw new Error('Failed to get public key: ' + error.message);
//       });
//   }

//   signEvent(e: any) {
//     return ExtensionSigner.sharedLock
//       .then(() => {
//         // @ts-ignore
//         return window.nostr.signEvent(e);
//       })
//       .catch(() => {
//         // Handle or throw an error if necessary
//       });
//   }

//   getRelays?(): Promise<Relays> {
//     return ExtensionSigner.sharedLock
//       .then(() => {
//         // @ts-ignore
//         return window.nostr.getRelays() as Promise<Relays>;
//       })
//       .then(relays => relays || {})
//       .catch(() => {
//         // Handle or throw an error if necessary
//         throw new Error('Unable to get relays');
//       });
//   }

//   encrypt?(pubkey: string, plaintext: string) {
//     return ExtensionSigner.sharedLock
//       .then(() => {
//         // @ts-ignore
//         return window.nostr.nip04.encrypt(pubkey, plaintext) as Promise<string>;
//       })
//       .catch((error) => {
//         // Handle or throw an error if necessary
//         throw new Error('Encryption failed: ' + error.message);
//       });
//   }

//   decrypt?(pubkey: string, ciphertext: string) {
//     return ExtensionSigner.sharedLock
//       .then(() => {
//         // @ts-ignore
//         return window.nostr.nip04.decrypt(pubkey, ciphertext) as Promise<string>;
//       })
//       .catch((error) => {
//         // Handle or throw an error if necessary
//         throw new Error('Encryption failed: ' + error.message);
//       });
//   }
// }

/**
 * Local signer that will use decrypted/unlocked private key
 * from the local storage to operate.
 */
// export class LocalSigner extends BaseSigner {
//   _type = SignerType.LOCAL
//   _locked: boolean = true
//   private store: ReturnType<typeof useAuth>
//   constructor() {
//     super()
//     this.store = useAuth()
//   }

//   get locked() {
//     return this._locked
//   }

//   set locked(value: boolean) {
//     this._locked = value
//   }

//   getPublicKey() {
//     return new Promise<string>((resolve, reject) => {
//       if (this.store.nsec) {
//         const { nsec } = this.store
//         const secretHex = nip19.decode(nsec).data as string
//         const publicKey = getPublicKey(secretHex)
//         resolve(publicKey)
//       } else {
//         const { encryptedPrivateKey } = this.store
//         if (encryptedPrivateKey) {
//           reject('Private key is locked')
//         } else {
//           reject('Local signer was not set up')
//         }
//       }
//     })
//   }
//   signEvent(event: UnsignedEvent) {
//     return new Promise((resolve, reject) => {
//       try {
//         const { nsec } = this.store
//         if (nsec === undefined) throw new Error('Private key is locked')
//         const secretHex = nip19.decode(nsec as string).data as string
//         const signature = getSignature(event, secretHex)
//         const signedEvent = {
//           ...event,
//           sig: signature
//         }
//         resolve(signedEvent)
//       } catch(err) {
//         console.error('Error in LocalSigner. err: ', err)
//         reject(err)
//       }
//     })
//   }
//   getRelays(): Promise<Relays> {
//     throw new Error('Method not implemented.');
//   }
//   encrypt?(pubkey: string, plaintext: string): Promise<string> {
//     const destinationPubKey = pubkey.startsWith('npub') ? nip19.decode(pubkey).data : pubkey
//     const { nsec } = this.store
//     if (!nsec) {
//       throw new Error('Private key is locked')
//     }
//     const secretHex = nip19.decode(nsec).data as string
//     return nip04.encrypt(secretHex, destinationPubKey as string, plaintext)
//   }
//   decrypt?(pubkey: string, ciphertext: string): Promise<string> {
//     const destinationPubKey = pubkey.startsWith('npub') ? nip19.decode(pubkey).data : pubkey
//     const { nsec } = this.store
//     if (!nsec) {
//       throw new Error('Private key is locked')
//     }
//     const secretHex = nip19.decode(nsec).data as string
//     return nip04.decrypt(secretHex, destinationPubKey as string, ciphertext)
//   }
// }

export default defineNuxtPlugin((nuxtApp) => {
  // nuxtApp.provide('localSigner', new LocalSigner())
  nuxtApp.provide('localSigner', new NDKPrivateKeySigner())
})