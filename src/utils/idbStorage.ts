import { AppConfig, StudentResult, Question } from '../types';

const DB_NAME = 'CBT_APP_STORAGE_V1';
const DB_VERSION = 1;
const STORE_NAME = 'keyval_store';

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[IndexedDB] Failed to open database:', request.error);
        resolve(null);
      };
    } catch (e) {
      console.warn('[IndexedDB] IndexedDB not available:', e);
      resolve(null);
    }
  });
}

/**
 * Save arbitrary data to IndexedDB (asynchronous, multi-gigabyte quota)
 */
export async function setItemIDB<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn(`[IndexedDB] Error setting item for key "${key}":`, req.error);
          resolve(false);
        };
        tx.onabort = () => resolve(false);
      } catch (err) {
        console.warn(`[IndexedDB] Transaction error for "${key}":`, err);
        resolve(false);
      }
    });
  } catch (e) {
    console.warn(`[IndexedDB] Failed to save key "${key}":`, e);
    return false;
  }
}

/**
 * Get data from IndexedDB
 */
export async function getItemIDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve((req.result as T) ?? null);
        };
        req.onerror = () => {
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });
  } catch (e) {
    return null;
  }
}

/**
 * Helper to strip heavy base64 data URLs from questions for localStorage fallback cache.
 * Note: IndexedDB and Firebase retain 100% of all images.
 */
export function stripImagesForLocalStorage(config: AppConfig): AppConfig {
  if (!config.questions || !Array.isArray(config.questions)) return config;

  const lightQuestions: Question[] = config.questions.map((q) => {
    // Check if question has heavy base64 images
    const isBase64 = (s?: string) => s && s.startsWith('data:image/');

    const cleanImg = isBase64(q.image) ? '[IMG_STORED_IN_IDB]' : q.image;
    const cleanImgs = q.images?.map((img) => (isBase64(img) ? '[IMG_STORED_IN_IDB]' : img));
    const cleanExplImg = isBase64(q.explanationImage) ? '[IMG_STORED_IN_IDB]' : q.explanationImage;
    const cleanExplImgs = q.explanationImages?.map((img) => (isBase64(img) ? '[IMG_STORED_IN_IDB]' : img));

    const cleanOptions = q.options?.map((opt) => ({
      ...opt,
      image: isBase64(opt.image) ? '[IMG_STORED_IN_IDB]' : opt.image,
    }));

    const cleanCategoryStatements = q.categoryStatements?.map((cs) => ({
      ...cs,
      image: isBase64(cs.image) ? '[IMG_STORED_IN_IDB]' : cs.image,
    }));

    return {
      ...q,
      image: cleanImg,
      images: cleanImgs,
      explanationImage: cleanExplImg,
      explanationImages: cleanExplImgs,
      options: cleanOptions,
      categoryStatements: cleanCategoryStatements,
    };
  });

  return {
    ...config,
    questions: lightQuestions,
  };
}

/**
 * Safely save AppConfig to LocalStorage with progressive fallbacks
 * to guarantee no unhandled QuotaExceededError is thrown.
 */
export function safeSaveConfigToLocalStorage(key: string, config: AppConfig): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  // Attempt 1: Direct save with full data
  try {
    localStorage.setItem(key, JSON.stringify(config));
    return true;
  } catch (firstErr: any) {
    // If quota exceeded, proceed with fallbacks
    console.warn('[LocalStorage] Quota reached for config, applying safe compression fallback...');
  }

  // Attempt 2: Strip heavy base64 images (images remain in IndexedDB & Firebase)
  try {
    const lightConfig = stripImagesForLocalStorage(config);
    localStorage.setItem(key, JSON.stringify(lightConfig));
    return true;
  } catch (secondErr: any) {
    console.warn('[LocalStorage] Quota still exceeded after stripping images, cleaning temporary keys...');
  }

  // Attempt 3: Try freeing up transient storage items if any exist
  try {
    const lightConfig = stripImagesForLocalStorage(config);
    // Remove legacy or large keys
    localStorage.removeItem('cbt_active_student_exam_session_v2');
    localStorage.setItem(key, JSON.stringify(lightConfig));
    return true;
  } catch (thirdErr: any) {
    console.warn('[LocalStorage] LocalStorage exhausted. Full data remains safely preserved in IndexedDB and Firebase.');
  }

  return false;
}
