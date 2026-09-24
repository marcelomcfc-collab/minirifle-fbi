"use client";

import { useEffect, useMemo, useState } from "react";
import ShotGrid from "@/components/ShotGrid";
import ShotPicker from "@/components/ShotPicker";
import ConfirmModal from "@/components/ConfirmModal";
import SessionResults from "@/components/SessionResults";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage";
import { emptyDisparos, emptyMoscas, MoscaGrid, ROUNDS, SHOTS_PER_ROUND, SessionDraft, Shot, ShotValue, SyncStatus, TOTAL_SHOTS, todayISO } from "@/lib/types";
import { saveSessionLocally, trySyncOne } from "@/lib/syncQueue";
import { getLocalSessionByLocalId } from "@/lib/db";

type ActiveShot = { round: number; shot: number } | null;

function findNextEmpty(disparos: Shot[][], fromFlatIndex: number): ActiveShot {
  const total = ROUNDS * SHOTS_PER_ROUND;
  for (let step = 1; step <= total; step++) {
    const idx = (fromFlatIndex + step) % total;
    const r = Math.floor(idx / SHOTS_PER_ROUND);
    const s = idx % SHOTS_PER_ROUND;
    if (disparos[r][s] === null) return { round: r, shot: s };
  }
  return null;
}

export default function HomePage() {
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const [activeShot, setActiveShot] = useState<ActiveShot>(null);
  const [showReset, setShowReset] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSession, setSubmittedSession] = useState<{
    fecha: string;
    disparos: ShotValue[][];
    moscas: MoscaGrid;
    syncStatus: SyncStatus;
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must run client-only, after hydration, to avoid mismatching the localStorage-derived draft with SSR output
    setDraft(loadDraft());
  }, []);

  useEffect(() => {
    if (draft) saveDraft(draft);
  }, [draft]);

  const loadedCount = useMemo(() => {
    if (!draft) return 0;
    return draft.disparos.flat().filter((v) => v !== null).length;
  }, [draft]);

  const isComplete = loadedCount === TOTAL_SHOTS;

  if (!draft) return null;

  if (submittedSession) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <SessionResults
          fecha={submittedSession.fecha}
          disparos={submittedSession.disparos}
          moscas={submittedSession.moscas}
          syncStatus={submittedSession.syncStatus}
          actions={
            <button
              onClick={() => {
                const fresh = { fecha: todayISO(), disparos: emptyDisparos(), moscas: emptyMoscas() };
                setDraft(fresh);
                saveDraft(fresh);
                setSubmittedSession(null);
              }}
              className="rounded-xl bg-accent py-3 text-sm font-semibold text-[#14171A]"
            >
              Nueva sesión
            </button>
          }
        />
      </div>
    );
  }

  const handleSelectValue = (value: ShotValue, isX: boolean) => {
    if (!activeShot) return;
    const next = draft.disparos.map((round) => [...round]);
    next[activeShot.round][activeShot.shot] = value;
    const nextMoscas = draft.moscas.map((round) => [...round]);
    nextMoscas[activeShot.round][activeShot.shot] = isX;
    const updatedDraft = { ...draft, disparos: next, moscas: nextMoscas };
    setDraft(updatedDraft);

    const flatIndex = activeShot.round * SHOTS_PER_ROUND + activeShot.shot;
    setActiveShot(findNextEmpty(next, flatIndex));
  };

  const handleReset = () => {
    const fresh = { ...draft, disparos: emptyDisparos(), moscas: emptyMoscas() };
    setDraft(fresh);
    setShowReset(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const disparosFinal = draft.disparos as ShotValue[][];
    const moscasFinal = draft.moscas;

    // Se guarda en IndexedDB primero: el dato ya está a salvo aunque no
    // haya conexión. Después se intenta sincronizar con Supabase; si falla
    // queda "pendiente" y el sync automático la subirá más tarde.
    const record = await saveSessionLocally(draft.fecha, disparosFinal, moscasFinal);
    await trySyncOne(record);
    const finalRecord = (await getLocalSessionByLocalId(record.localId)) ?? record;

    setSubmitting(false);
    setSubmittedSession({
      fecha: finalRecord.fecha,
      disparos: finalRecord.disparos,
      moscas: finalRecord.moscas ?? emptyMoscas(),
      syncStatus: finalRecord.status,
    });
    clearDraft();
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-foreground-muted">Fecha de la sesión</span>
          <input
            type="date"
            value={draft.fecha}
            onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-foreground-muted">Progreso</span>
          <span className="font-semibold text-foreground">{loadedCount}/{TOTAL_SHOTS}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${(loadedCount / TOTAL_SHOTS) * 100}%` }}
          />
        </div>
      </div>

      <ShotGrid
        disparos={draft.disparos}
        moscas={draft.moscas}
        onOpenShot={(round, shot) => setActiveShot({ round, shot })}
      />

      <div className="flex gap-2.5 pb-2">
        <button
          onClick={() => setShowReset(true)}
          className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground-muted"
        >
          Reiniciar sesión
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || submitting}
          className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-[#14171A] disabled:opacity-40"
        >
          {submitting ? "Guardando…" : "Enviar resultados"}
        </button>
      </div>

      {activeShot && (
        <ShotPicker
          round={activeShot.round}
          shot={activeShot.shot}
          currentValue={draft.disparos[activeShot.round][activeShot.shot]}
          currentIsX={draft.moscas[activeShot.round][activeShot.shot]}
          onSelect={handleSelectValue}
          onClose={() => setActiveShot(null)}
        />
      )}

      {showReset && (
        <ConfirmModal
          title="¿Reiniciar sesión?"
          description="Se van a borrar los disparos cargados. La fecha se mantiene."
          confirmLabel="Reiniciar"
          onConfirm={handleReset}
          onCancel={() => setShowReset(false)}
        />
      )}
    </div>
  );
}
