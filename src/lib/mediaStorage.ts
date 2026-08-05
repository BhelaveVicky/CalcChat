/**
 * IndexedDB helper for caching large media files (videos, heavy audio, attachments)
 * locally in the browser so they bypass Firestore document 1MB size limits.
 */

const DB_NAME = 'CalcChatMediaDB';
const STORE_NAME = 'mediaStore';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

/**
 * Saves a media payload (data URL or string) to IndexedDB under the given ID.
 */
export async function saveMediaBlob(id: string, mediaData: string): Promise<boolean> {
  if (!id || !mediaData) return false;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(mediaData, id);

      request.onsuccess = () => resolve(true);
      request.onerror = (err) => {
        console.warn('Error saving media to IndexedDB:', err);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Failed to access IndexedDB for saving:', err);
    return false;
  }
}

/**
 * Retrieves a media payload (data URL) from IndexedDB by ID.
 */
export async function getMediaBlob(id: string): Promise<string | null> {
  if (!id) return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(typeof result === 'string' ? result : null);
      };

      request.onerror = (err) => {
        console.warn('Error fetching media from IndexedDB:', err);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Failed to access IndexedDB for fetching:', err);
    return null;
  }
}

/**
 * Deletes a media payload from IndexedDB by ID.
 */
export async function deleteMediaBlob(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}
