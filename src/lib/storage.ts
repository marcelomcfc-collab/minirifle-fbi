import { emptyDisparos, emptyMoscas, SessionDraft, todayISO } from "./types";

const DRAFT_KEY = "minirifle-fbi:draft-session";

function emptyDraft(): SessionDraft {
  return { fecha: todayISO(), disparos: emptyDisparos(), moscas: emptyMoscas() };
}

export function loadDraft(): SessionDraft {
  if (typeof window === "undefined") {
    return emptyDraft();
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as SessionDraft;
    if (!parsed.fecha || !Array.isArray(parsed.disparos)) {
      return emptyDraft();
    }
    // Compatibilidad con borradores guardados antes de sumar la mosca (X).
    if (!Array.isArray(parsed.moscas)) {
      parsed.moscas = emptyMoscas();
    }
    return parsed;
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: SessionDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
