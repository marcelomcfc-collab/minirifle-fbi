"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, SESSIONS_TABLE } from "@/lib/supabaseClient";
import { SessionRecord } from "@/lib/types";
import { calcSessionStats } from "@/lib/stats";
import ConfirmModal from "@/components/ConfirmModal";

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HistorialPage() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchSessions = async () => {
    setError(null);
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select("*")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError("No se pudo cargar el historial. Revisá tu conexión.");
      setSessions([]);
      return;
    }
    setSessions((data ?? []) as SessionRecord[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    fetchSessions();
  }, []);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const handleDeleteSelected = async () => {
    setBusy(true);
    const { error } = await supabase
      .from(SESSIONS_TABLE)
      .delete()
      .in("id", Array.from(selected));
    setBusy(false);
    setConfirmDeleteSelected(false);
    if (error) {
      setError("No se pudieron borrar las sesiones seleccionadas.");
      return;
    }
    exitSelectionMode();
    fetchSessions();
  };

  const handleDeleteAll = async () => {
    if (!sessions || sessions.length === 0) {
      setConfirmDeleteAll(false);
      return;
    }
    setBusy(true);
    const ids = sessions.map((s) => s.id);
    const { error } = await supabase.from(SESSIONS_TABLE).delete().in("id", ids);
    setBusy(false);
    setConfirmDeleteAll(false);
    if (error) {
      setError("No se pudo borrar el historial.");
      return;
    }
    exitSelectionMode();
    fetchSessions();
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Historial de sesiones</h2>
        {sessions && sessions.length > 0 && (
          <button
            onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            className="text-xs font-medium text-accent"
          >
            {selectionMode ? "Cancelar" : "Seleccionar"}
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-val-0">
          {error}
        </p>
      )}

      {sessions === null && (
        <p className="py-8 text-center text-sm text-foreground-muted">Cargando…</p>
      )}

      {sessions && sessions.length === 0 && !error && (
        <p className="py-8 text-center text-sm text-foreground-muted">
          Todavía no hay sesiones guardadas.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {sessions?.map((session) => {
          const stats = calcSessionStats(session.disparos);
          const isSelected = selected.has(session.id);
          const content = (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              {selectionMode && (
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? "border-accent bg-accent" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#14171A"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{formatFecha(session.fecha)}</p>
                <p className="text-xs text-foreground-muted">
                  Mejor R{stats.bestRound.index + 1} · Peor R{stats.worstRound.index + 1}
                </p>
              </div>
              <p className="text-lg font-bold text-accent">{stats.resultado}</p>
              {!selectionMode && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-foreground-muted">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );

          return selectionMode ? (
            <button key={session.id} onClick={() => toggleSelected(session.id)} className="text-left">
              {content}
            </button>
          ) : (
            <Link key={session.id} href={`/historial/${session.id}`}>
              {content}
            </Link>
          );
        })}
      </div>

      {sessions && sessions.length > 0 && !selectionMode && (
        <button
          onClick={() => setConfirmDeleteAll(true)}
          className="mt-2 rounded-xl border border-danger/40 py-3 text-sm font-medium text-val-0"
        >
          Borrar todo el historial
        </button>
      )}

      {selectionMode && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-md px-4">
          <button
            onClick={() => setConfirmDeleteSelected(true)}
            disabled={busy}
            className="w-full rounded-xl bg-danger py-3 text-sm font-semibold text-[#EDEDE8] shadow-lg"
          >
            Borrar seleccionadas ({selected.size})
          </button>
        </div>
      )}

      {confirmDeleteSelected && (
        <ConfirmModal
          title={`¿Borrar ${selected.size} sesión(es)?`}
          description="Esta acción no se puede deshacer."
          confirmLabel="Borrar"
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmDeleteSelected(false)}
        />
      )}

      {confirmDeleteAll && (
        <ConfirmModal
          title="¿Borrar todo el historial?"
          description="Se van a eliminar todas las sesiones guardadas. Esta acción no se puede deshacer."
          confirmLabel="Borrar todo"
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmDeleteAll(false)}
        />
      )}
    </div>
  );
}
