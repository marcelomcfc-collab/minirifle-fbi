import { supabase, SESSIONS_TABLE } from "./supabaseClient";
import {
  deleteLocalSession,
  getAllLocalSessions,
  getLocalSessionByLocalId,
  putLocalSession,
} from "./db";
import { LocalSessionRecord, SessionRecord, ShotValue } from "./types";

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("minirifle-sync-changed"));
  }
}

function sortByFechaAsc(a: LocalSessionRecord, b: LocalSessionRecord) {
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  return a.created_at < b.created_at ? -1 : 1;
}

// Guarda la sesión en IndexedDB de inmediato, sin depender de la conexión.
export async function saveSessionLocally(
  fecha: string,
  disparos: ShotValue[][]
): Promise<LocalSessionRecord> {
  const record: LocalSessionRecord = {
    localId: crypto.randomUUID(),
    remoteId: null,
    fecha,
    disparos,
    created_at: new Date().toISOString(),
    status: "pending",
  };
  await putLocalSession(record);
  notifyChange();
  return record;
}

// Upsert por local_id: si se reintenta un sync que ya se aplicó, no duplica la fila.
async function insertToSupabase(record: LocalSessionRecord): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .upsert(
        { local_id: record.localId, fecha: record.fecha, disparos: record.disparos },
        { onConflict: "local_id" }
      )
      .select("id")
      .single();
    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch {
    return null;
  }
}

export async function trySyncOne(record: LocalSessionRecord): Promise<boolean> {
  const remoteId = await insertToSupabase(record);
  if (!remoteId) return false;
  await putLocalSession({ ...record, remoteId, status: "synced" });
  notifyChange();
  return true;
}

let syncing = false;

export async function syncPendingSessions(): Promise<void> {
  if (syncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  syncing = true;
  try {
    const all = await getAllLocalSessions();
    const pending = all.filter((s) => s.status === "pending");
    for (const record of pending) {
      await trySyncOne(record);
    }
  } finally {
    syncing = false;
  }
}

export async function getPendingCount(): Promise<number> {
  const all = await getAllLocalSessions();
  return all.filter((s) => s.status === "pending").length;
}

export async function getSessionById(id: string): Promise<LocalSessionRecord | null> {
  if (id.startsWith("local:")) {
    return getLocalSessionByLocalId(id.slice("local:".length));
  }
  const { data, error } = await supabase
    .from(SESSIONS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!error && data) {
    const row = data as SessionRecord;
    return {
      localId: `remote:${row.id}`,
      remoteId: row.id,
      fecha: row.fecha,
      disparos: row.disparos,
      created_at: row.created_at,
      status: "synced",
    };
  }
  // Sin conexión o falló el fetch: buscar en el caché local por remoteId.
  const all = await getAllLocalSessions();
  return all.find((s) => s.remoteId === id) ?? null;
}

// Combina lo sincronizado en Supabase con lo pendiente/local, así ninguna
// sesión "desaparece" del historial/evolución mientras no hay conexión.
export async function getMergedSessions(): Promise<{
  sessions: LocalSessionRecord[];
  offline: boolean;
}> {
  const local = await getAllLocalSessions();
  const localByRemoteId = new Map(
    local.filter((s) => s.remoteId).map((s) => [s.remoteId as string, s])
  );
  const pendingOnly = local.filter((s) => s.status === "pending");

  const { data, error } = await supabase
    .from(SESSIONS_TABLE)
    .select("*")
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { sessions: [...local].sort(sortByFechaAsc), offline: true };
  }

  const remoteRows = data as SessionRecord[];
  const merged: LocalSessionRecord[] = [];

  for (const row of remoteRows) {
    const existing = localByRemoteId.get(row.id);
    const record: LocalSessionRecord = {
      localId: existing?.localId ?? `remote:${row.id}`,
      remoteId: row.id,
      fecha: row.fecha,
      disparos: row.disparos,
      created_at: row.created_at,
      status: "synced",
    };
    merged.push(record);
    await putLocalSession(record);
  }

  merged.push(...pendingOnly);
  merged.sort(sortByFechaAsc);
  return { sessions: merged, offline: false };
}

// Prioriza no perder datos: borra en Supabase lo sincronizado y en IndexedDB
// lo pendiente. Si falla el borrado remoto no se toca el caché local.
export async function deleteSessions(
  records: LocalSessionRecord[]
): Promise<{ error: boolean }> {
  const synced = records.filter((r) => r.status === "synced" && r.remoteId);
  const pendingOnly = records.filter((r) => !(r.status === "synced" && r.remoteId));

  let error = false;
  if (synced.length > 0) {
    const ids = synced.map((r) => r.remoteId as string);
    const { error: supaError } = await supabase.from(SESSIONS_TABLE).delete().in("id", ids);
    if (supaError) {
      error = true;
    } else {
      for (const r of synced) await deleteLocalSession(r.localId);
    }
  }
  for (const r of pendingOnly) {
    await deleteLocalSession(r.localId);
  }
  notifyChange();
  return { error };
}
