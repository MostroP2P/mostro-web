import Dexie from 'dexie'
import { AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC, AUTH_LOCAL_STORAGE_NWC_PASSWORD } from '~/stores/types'

interface AuthRecord {
  id?: number
  key: string
  value: string
  createdAt: number
}

class AuthDatabase extends Dexie {
  authData!: Dexie.Table<AuthRecord, number>

  constructor() {
    super('mostro-auth-db')
    this.version(1).stores({
      authData: '++id, &key, value, createdAt'
    })
  }
}

export function useAuthStorage() {
  // Create a singleton instance only on client-side
  const db = import.meta.client ? new AuthDatabase() : null
  
  /**
   * Check if IndexedDB is available in the browser
   */
  const isIndexedDBAvailable = (): boolean => {
    // Always return false on server-side
    if (!import.meta.client) return false
    
    try {
      return !!window.indexedDB
    } catch (e) {
      return false
    }
  }

  /**
   * Verify that IndexedDB is available, throw error if not
   */
  const verifyIndexedDBAvailable = (): void => {
    if (!isIndexedDBAvailable()) {
      throw new Error('IndexedDB is not available in this browser. For security reasons, sensitive data cannot be stored.')
    }
  }

  /**
   * Store a value in IndexedDB
   */
  const setValue = async (key: string, value: string): Promise<void> => {
    verifyIndexedDBAvailable()
    
    try {
      // Check if key already exists
      const existing = await db!.authData
        .where('key')
        .equals(key)
        .first()

      if (existing) {
        // Update existing record
        await db!.authData
          .where('key')
          .equals(key)
          .modify({ value, createdAt: Math.floor(Date.now() / 1000) })
      } else {
        // Add new record
        await db!.authData.add({
          key,
          value,
          createdAt: Math.floor(Date.now() / 1000)
        })
      }
    } catch (error) {
      console.error(`Error setting key-value pair [${key} -> ${value}] in IndexedDB:`, error)
      throw error
    }
  }

  /**
   * Get a value from IndexedDB
   */
  const getValue = async (key: string): Promise<string | null> => {
    verifyIndexedDBAvailable()
    
    try {
      const record = await db!.authData
        .where('key')
        .equals(key)
        .first()
      
      return record ? record.value : null
    } catch (error) {
      console.error(`Error getting value for key ${key} from IndexedDB:`, error)
      throw error
    }
  }

  /**
   * Remove a value from IndexedDB
   */
  const removeValue = async (key: string): Promise<void> => {
    verifyIndexedDBAvailable()
    
    try {
      await db!.authData
        .where('key')
        .equals(key)
        .delete()
    } catch (error) {
      console.error(`Error removing value for key ${key} from IndexedDB:`, error)
      throw error
    }
  }

  /**
   * Migrate sensitive data from localStorage to IndexedDB
   * This should be called once during app initialization
   */
  const migrateFromLocalStorage = async (): Promise<void> => {
    // Skip on server-side
    if (!import.meta.client) return
    
    verifyIndexedDBAvailable()
    
    try {
      // Migrate mnemonic
      const mnemonic = localStorage.getItem(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
      if (mnemonic) {
        await setValue(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC, mnemonic)
        // Remove from localStorage after successful migration
        localStorage.removeItem(AUTH_LOCAL_STORAGE_DECRYPTED_MNEMONIC)
        console.log('Migrated mnemonic from localStorage to IndexedDB')
      }

      // Migrate NWC password
      const nwcPassword = localStorage.getItem(AUTH_LOCAL_STORAGE_NWC_PASSWORD)
      if (nwcPassword) {
        await setValue(AUTH_LOCAL_STORAGE_NWC_PASSWORD, nwcPassword)
        // Remove from localStorage after successful migration
        localStorage.removeItem(AUTH_LOCAL_STORAGE_NWC_PASSWORD)
        console.log('Migrated NWC password from localStorage to IndexedDB')
      }
    } catch (error) {
      console.error('Error migrating data from localStorage to IndexedDB:', error)
      throw error
    }
  }

  return {
    isIndexedDBAvailable,
    setValue,
    getValue,
    removeValue,
    migrateFromLocalStorage
  }
} 