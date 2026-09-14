"use client";

import { useEffect, useMemo, useState } from "react";
import { LocalSessionRecord } from "@/lib/types";
import { getMergedSessions } from "@/lib/syncQueue";
import { calcSessionStats, calcTrend } from "@/lib/stats";
import { ScoreEvolutionChart, PctDiecesEvolutionChart } from "@/components/EvolutionCharts";

function formatFechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

const TREND_LABEL: Record<string, string> = {
  mejorando: "Mejorando",
  estable: "Estable",
  bajando: "Bajando",
};

const TREND_COLOR: Record<string, string> = {
  mejorando: "text-val-9",
  estable: "text-foreground-muted",
  bajando: "text-val-0",
};

export default function EvolucionPage() {
  const [sessions, setSessions] = useState<LocalSessionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      const { sessions: merged, offline } = await getMergedSessions();
      setSessions(merged);
      if (offline && merged.length === 0) {
        setError("No se pudo cargar la evolución. Revisá tu conexión.");
      } else {
        setError(null);
      }
    };
    fetchSessions();
    const onChanged = () => fetchSessions();
    window.addEventListener("minirifle-sync-changed", onChanged);
    return () => window.removeEventListener("minirifle-sync-changed", onChanged);
  }, []);

  const rows = useMemo(() => {
    if (!sessions) return [];
    return sessions.map((s) => ({
      session: s,
      stats: calcSessionStats(s.disparos),
    }));
  }, [sessions]);

  const chartData = rows.map((r) => ({
    fechaLabel: formatFechaCorta(r.session.fecha),
    puntaje: r.stats.puntajeTotal,
    pctDieces: r.stats.valuePercents[10],
  }));

  const totalScores = rows.map((r) => r.stats.puntajeTotal);
  const trend = calcTrend(totalScores);
  const bestSession = rows.reduce<typeof rows[number] | null>(
    (best, r) => (!best || r.stats.puntajeTotal > best.stats.puntajeTotal ? r : best),
    null
  );
  const avgTotal =
    totalScores.length > 0 ? totalScores.reduce((s, v) => s + v, 0) / totalScores.length : 0;

  if (sessions === null) {
    return <p className="px-4 py-8 text-center text-sm text-foreground-muted">Cargando…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-4">
        {error && (
          <p className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-val-0">
            {error}
          </p>
        )}
        <p className="py-8 text-center text-sm text-foreground-muted">
          Necesitás al menos una sesión guardada para ver la evolución.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h2 className="text-base font-semibold text-foreground">Evolución</h2>

      {error && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-val-0">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-xs text-foreground-muted">Tendencia general</p>
          <p className={`mt-1 text-lg font-bold ${TREND_COLOR[trend]}`}>{TREND_LABEL[trend]}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-xs text-foreground-muted">Promedio general</p>
          <p className="mt-1 text-lg font-bold text-foreground">{avgTotal.toFixed(1)}</p>
        </div>
      </div>

      {bestSession && (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft p-4">
          <p className="text-xs text-foreground-muted">Mejor sesión registrada</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-foreground">{formatFechaCorta(bestSession.session.fecha)}</p>
            <p className="text-xl font-bold text-accent">{bestSession.stats.resultado}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Puntaje total por sesión</h3>
        <ScoreEvolutionChart data={chartData} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">% de dieces por sesión</h3>
        <PctDiecesEvolutionChart data={chartData} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Comparativa de sesiones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-foreground-muted">
                <th className="pb-2 pr-2 font-medium">Fecha</th>
                <th className="pb-2 pr-2 font-medium">Resultado</th>
                <th className="pb-2 pr-2 font-medium">Mejor</th>
                <th className="pb-2 font-medium">Peor</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.session.localId} className="border-t border-border">
                  <td className="py-2 pr-2 text-foreground">
                    <span className="inline-flex items-center gap-1">
                      {formatFechaCorta(r.session.fecha)}
                      {r.session.status === "pending" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" title="Sin sincronizar" />
                      )}
                    </span>
                  </td>
                  <td className="py-2 pr-2 font-semibold text-accent">{r.stats.resultado}</td>
                  <td className="py-2 pr-2 text-val-9">
                    R{r.stats.bestRound.index + 1} · {r.stats.bestRound.score}
                  </td>
                  <td className="py-2 text-val-0">
                    R{r.stats.worstRound.index + 1} · {r.stats.worstRound.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
