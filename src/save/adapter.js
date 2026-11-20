import { deserialize, serialize } from './serialize.js';

/**
 * @returns {Storage}
 */
export function createMemoryStorage() {
  /** @type {Map<string, string>} */
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

/**
 * @param {{ getItem: Function, setItem: Function, removeItem: Function }} storage
 * @param {string} [key]
 */
export function createSaveAdapter(storage, key = 'cfcard.save.v1') {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('storage must implement getItem and setItem');
  }
  return {
    save(profile) {
      storage.setItem(key, serialize(profile));
    },
    load() {
      const raw = storage.getItem(key);
      if (raw == null) return null;
      return deserialize(raw);
    },
    clear() {
      if (typeof storage.removeItem === 'function') storage.removeItem(key);
    },
  };
}

export function createMemoryAdapter(key) {
  return createSaveAdapter(createMemoryStorage(), key);
}

/**
 * Browser localStorage, or a Storage-like object passed in tests.
 * @param {Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>} [storage]
 * @param {string} [key]
 */
export function createLocalStorageAdapter(storage = globalThis.localStorage, key) {
  if (!storage || typeof storage.getItem !== 'function') {
    throw new Error('localStorage is not available. Pass a Storage-like object or use createMemoryAdapter.');
  }
  return createSaveAdapter(storage, key);
}
