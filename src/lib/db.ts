import { LocalSessionRecord } from "./types";

const DB_NAME = "minirifle-fbi";
const DB_VERSION = 1;
const STORE = "sessions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "localId" });
        store.createIndex("status", "status");
        store.createIndex("remoteId", "remoteId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putLocalSession(record: LocalSessionRecord): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllLocalSessions(): Promise<LocalSessionRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as LocalSessionRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalSession(localId: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalSessionByLocalId(
  localId: string
): Promise<LocalSessionRecord | null> {
  const all = await getAllLocalSessions();
  return all.find((s) => s.localId === localId) ?? null;
}

export async function getLocalSessionByRemoteId(
  remoteId: string
): Promise<LocalSessionRecord | null> {
  const all = await getAllLocalSessions();
  return all.find((s) => s.remoteId === remoteId) ?? null;
}
