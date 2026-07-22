const DB_NAME = 'aor-photos-v1'
const STORE = 'photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

/** Persist a photo dataUrl on-device (survives refresh, not limited like localStorage). */
export async function idbPutPhoto(key: string, dataUrl: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(dataUrl, key)
  })
  db.close()
}

export async function idbGetPhoto(key: string): Promise<string | undefined> {
  const db = await openDb()
  const value = await new Promise<string | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => {
      const result = req.result
      resolve(typeof result === 'string' ? result : undefined)
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
  })
  db.close()
  return value
}

export async function idbGetAllPhotoEntries(): Promise<Array<{ key: string; dataUrl: string }>> {
  const db = await openDb()
  const entries = await new Promise<Array<{ key: string; dataUrl: string }>>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.openCursor()
    const out: Array<{ key: string; dataUrl: string }> = []
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) {
        resolve(out)
        return
      }
      if (typeof cursor.value === 'string') {
        out.push({ key: String(cursor.key), dataUrl: cursor.value })
      }
      cursor.continue()
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB cursor failed'))
  })
  db.close()
  return entries
}
