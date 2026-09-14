export type ShotValue = 10 | 9 | 8 | 7 | 0;

export type Shot = ShotValue | null;

export const ROUNDS = 8;
export const SHOTS_PER_ROUND = 5;
export const TOTAL_SHOTS = ROUNDS * SHOTS_PER_ROUND;

export const SHOT_VALUES: ShotValue[] = [10, 9, 8, 7, 0];

export type SessionDraft = {
  fecha: string;
  disparos: Shot[][];
};

export type SessionRecord = {
  id: string;
  fecha: string;
  disparos: ShotValue[][];
  created_at: string;
};

export function emptyDisparos(): Shot[][] {
  return Array.from({ length: ROUNDS }, () => Array<Shot>(SHOTS_PER_ROUND).fill(null));
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
