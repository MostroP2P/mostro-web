import * as fakeIndexedDB from 'fake-indexeddb';
import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

globalThis.indexedDB = fakeIndexedDB.indexedDB;
globalThis.IDBKeyRange = FDBKeyRange;
