import { supabase, SESSIONS_TABLE } from "./supabaseClient";
import {
  deleteLocalSession,
  getAllLocalSessions,
  getLocalSessionByLocalId,
  getLocalSessionByRemoteId,
  putLocalSession,
} from "./db";
import { LocalSessionRecord, MoscaGrid, SessionRecord, ShotValue } from "./types";

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
  disparos: ShotValue[][],
  moscas: MoscaGrid
): Promise<LocalSessionRecord> {
  const record: LocalSessionRecord = {
    localId: crypto.randomUUID(),
    remoteId: null,
    fecha,
    disparos,
    moscas,
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
        {
          local_id: record.localId,
          fecha: record.fecha,
          disparos: record.disparos,
          moscas: record.moscas,
        },
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

// Intenta efectivizar en Supabase las sesiones marcadas "pending-delete"
// (borradas localmente sin conexión). Si se logra, la tumba local se
// elimina del todo; si sigue sin conexión, se deja tal cual para reintentar.
async function trySyncOneDelete(record: LocalSessionRecord): Promise<boolean> {
  if (!record.remoteId) {
    // No debería pasar (pending-delete siempre viene de una sesión sincronizada),
    // pero si ocurre, no hay nada remoto que borrar: se limpia el registro local.
    await deleteLocalSession(record.localId);
    return true;
  }
  try {
    const { error } = await supabase.from(SESSIONS_TABLE).delete().eq("id", record.remoteId);
    if (error) return false;
    await deleteLocalSession(record.localId);
    return true;
  } catch {
    return false;
  }
}

let syncing = false;

// `force` salta el chequeo de navigator.onLine: en iOS/Safari ese valor puede
// quedar desactualizado justo después de reconectar, así que el botón manual
// "Sincronizar ahora" lo ignora y deja que el propio fetch confirme si hay red.
export async function syncPendingSessions({ force = false }: { force?: boolean } = {}): Promise<void> {
  if (syncing) return;
  if (!force && typeof navigator !== "undefined" && !navigator.onLine) return;
  syncing = true;
  try {
    const all = await getAllLocalSessions();
    const pendingCreates = all.filter((s) => s.status === "pending");
    for (const record of pendingCreates) {
      await trySyncOne(record);
    }
    const pendingDeletes = all.filter((s) => s.status === "pending-delete");
    let deletedAny = false;
    for (const record of pendingDeletes) {
      if (await trySyncOneDelete(record)) deletedAny = true;
    }
    if (deletedAny) notifyChange();
  } finally {
    syncing = false;
  }
}

export async function getPendingCount(): Promise<number> {
  const all = await getAllLocalSessions();
  return all.filter((s) => s.status === "pending" || s.status === "pending-delete").length;
}

export async function getSessionById(id: string): Promise<LocalSessionRecord | null> {
  if (id.startsWith("local:")) {
    return getLocalSessionByLocalId(id.slice("local:".length));
  }
  // Una tumba local (borrada sin conexión) gana siempre: aunque el fetch
  // remoto todavía la devuelva, para el usuario ya no existe.
  const tombstone = await getLocalSessionByRemoteId(id);
  if (tombstone?.status === "pending-delete") return null;

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
      moscas: row.moscas,
      created_at: row.created_at,
      status: "synced",
    };
  }
  // Sin conexión o falló el fetch: buscar en el caché local por remoteId.
  return tombstone ?? getLocalSessionByRemoteId(id);
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
  // Tumbas: sesiones borradas sin conexión. Se excluyen de la vista aunque
  // Supabase todavía las devuelva, hasta que el sync logre borrarlas ahí también.
  const pendingDeleteRemoteIds = new Set(
    local.filter((s) => s.status === "pending-delete" && s.remoteId).map((s) => s.remoteId as string)
  );

  const { data, error } = await supabase
    .from(SESSIONS_TABLE)
    .select("*")
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    const visible = local.filter((s) => s.status !== "pending-delete");
    return { sessions: [...visible].sort(sortByFechaAsc), offline: true };
  }

  const remoteRows = data as SessionRecord[];
  const merged: LocalSessionRecord[] = [];

  for (const row of remoteRows) {
    if (pendingDeleteRemoteIds.has(row.id)) continue;
    const existing = localByRemoteId.get(row.id);
    const record: LocalSessionRecord = {
      localId: existing?.localId ?? `remote:${row.id}`,
      remoteId: row.id,
      fecha: row.fecha,
      disparos: row.disparos,
      moscas: row.moscas,
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

// Borra sesiones ya sincronizadas/pendientes. A diferencia de una sesión
// "pending" (nunca llegó a Supabase, se borra directo), una sesión "synced"
// intenta borrarse en Supabase de inmediato; si falla (sin conexión) queda
// como "pending-delete": desaparece ya de la UI y el sync en background la
// efectiviza en Supabase apenas vuelva la señal, sin que reaparezca.
export async function deleteSessionsQueued(
  records: LocalSessionRecord[]
): Promise<{ error: boolean }> {
  let error = false;
  for (const r of records) {
    try {
      if (r.status === "synced" && r.remoteId) {
        const { error: supaError } = await supabase
          .from(SESSIONS_TABLE)
          .delete()
          .eq("id", r.remoteId);
        if (supaError) {
          // Sin conexión (u otro fallo transitorio): se marca "pending-delete"
          // en vez de fallar. Desaparece ya de la UI y el sync la efectiviza
          // en Supabase apenas vuelva la señal.
          await putLocalSession({ ...r, status: "pending-delete" });
        } else {
          await deleteLocalSession(r.localId);
        }
      } else {
        // "pending" (nunca sincronizada) o ya "pending-delete": no hay nada
        // remoto pendiente de intentar ahora, se limpia directo del caché local.
        await deleteLocalSession(r.localId);
      }
    } catch {
      error = true;
    }
  }
  notifyChange();
  return { error };
}
