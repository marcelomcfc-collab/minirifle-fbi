import { emptyDisparos, SessionDraft, todayISO } from "./types";

const DRAFT_KEY = "minirifle-fbi:draft-session";

export function loadDraft(): SessionDraft {
  if (typeof window === "undefined") {
    return { fecha: todayISO(), disparos: emptyDisparos() };
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return { fecha: todayISO(), disparos: emptyDisparos() };
    const parsed = JSON.parse(raw) as SessionDraft;
    if (!parsed.fecha || !Array.isArray(parsed.disparos)) {
      return { fecha: todayISO(), disparos: emptyDisparos() };
    }
    return parsed;
  } catch {
    return { fecha: todayISO(), disparos: emptyDisparos() };
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
