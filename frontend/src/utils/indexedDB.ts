const DB_NAME = "BoulderVideoDB";
const STORE_NAME = "videos";

export const saveVideoToDB = (file: File) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = (e: any) => e.target.result.createObjectStore(STORE_NAME);
  req.onsuccess = (e: any) => {
    const db = e.target.result;
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, "current_video");
  }
}

export const loadVideoFromDB = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e: any) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) return resolve(null);
      const tx = db.transaction(STORE_NAME, "readonly");
      const getReq = tx.objectStore(STORE_NAME).get("current_video");
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    }
    req.onerror = () => resolve(null);
  })
}

export const clearVideoFromDB = () => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onsuccess = (e: any) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete("current_video");
  }
}