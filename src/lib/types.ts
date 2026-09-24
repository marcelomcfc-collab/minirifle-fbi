export type ShotValue = 10 | 9 | 8 | 7 | 0;

export type Shot = ShotValue | null;

export const ROUNDS = 8;
export const SHOTS_PER_ROUND = 5;
export const TOTAL_SHOTS = ROUNDS * SHOTS_PER_ROUND;

export const SHOT_VALUES: ShotValue[] = [10, 9, 8, 7, 0];

// Grilla paralela a `disparos` (mismas 8x5 posiciones): true donde ese
// disparo (que vale 10) se cargó como mosca/centro interno en vez de un
// 10 común. No es un valor de puntaje aparte — a los fines del cálculo
// de estadísticas una mosca siempre es un 10 normal.
export type MoscaGrid = boolean[][];

export type SessionDraft = {
  fecha: string;
  disparos: Shot[][];
  moscas: MoscaGrid;
};

export type SessionRecord = {
  id: string;
  fecha: string;
  disparos: ShotValue[][];
  moscas: MoscaGrid | null;
  created_at: string;
};

export type SyncStatus = "pending" | "synced" | "pending-delete";

// Registro en el caché local (IndexedDB). Une sesiones creadas offline
// (sin remoteId todavía) con el espejo local de sesiones ya sincronizadas
// desde Supabase, para que historial/evolución funcionen sin conexión.
// status "pending-delete" es una sesión ya sincronizada que el usuario
// borró sin conexión: se oculta de inmediato en la UI pero se mantiene
// como "tumba" local hasta poder borrarla también en Supabase.
export type LocalSessionRecord = {
  localId: string;
  remoteId: string | null;
  fecha: string;
  disparos: ShotValue[][];
  moscas: MoscaGrid | null;
  created_at: string;
  status: SyncStatus;
};

export function emptyDisparos(): Shot[][] {
  return Array.from({ length: ROUNDS }, () => Array<Shot>(SHOTS_PER_ROUND).fill(null));
}

export function emptyMoscas(): MoscaGrid {
  return Array.from({ length: ROUNDS }, () => Array<boolean>(SHOTS_PER_ROUND).fill(false));
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
