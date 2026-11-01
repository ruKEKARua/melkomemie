export type StorageCacheRecord<T> = {
  data: T;
  cachedAt: number;
};

export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__mm_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function readStorageRecord<T>(key: string, ttlMs?: number): T | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const record = JSON.parse(raw) as StorageCacheRecord<T>;
    if (!record || typeof record !== 'object') return null;
    if (ttlMs !== undefined && typeof record.cachedAt === 'number') {
      if (Date.now() - record.cachedAt > ttlMs) {
        return null;
      }
    }
    return record.data;
  } catch {
    return null;
  }
}

export function writeStorageRecord<T>(
  key: string,
  data: T,
  onQuotaExceeded?: () => void
): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    const record: StorageCacheRecord<T> = {
      data,
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(record));
    return true;
  } catch (error) {
    if (onQuotaExceeded) {
      try {
        onQuotaExceeded();
        const record: StorageCacheRecord<T> = {
          data,
          cachedAt: Date.now(),
        };
        window.localStorage.setItem(key, JSON.stringify(record));
        return true;
      } catch {
        return false;
      }
    }
    console.warn(`[storageCache] Failed to write key "${key}":`, error);
    return false;
  }
}

export function purgeExpiredStorageRecords(prefix: string, ttlMs: number): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as { cachedAt?: number };
            if (parsed.cachedAt && now - parsed.cachedAt > ttlMs) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[storageCache] Error purging expired keys:', error);
  }
}

export function clearStorageByPrefix(prefix: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[storageCache] Failed to clear storage by prefix:', error);
  }
}
