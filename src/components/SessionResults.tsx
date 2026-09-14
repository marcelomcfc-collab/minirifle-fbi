"use client";

import { useRef, useState } from "react";
import { ShotValue, SHOT_VALUES } from "@/lib/types";
import { calcSessionStats } from "@/lib/stats";
import { VALUE_TEXT_CLASS, valueLabel } from "@/lib/valueStyle";
import RoundBarChart from "./RoundBarChart";
import ValueDistributionChart from "./ValueDistributionChart";
import { exportElementToPdf } from "@/lib/pdfExport";

type Props = {
  fecha: string;
  disparos: ShotValue[][];
  actions?: React.ReactNode;
};

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function mitadesMensaje(diff: number): string {
  if (diff > 1.5) return "Mejoró en la segunda mitad respecto a la primera.";
  if (diff < -1.5) return "Bajó en la segunda mitad (posible fatiga).";
  return "Se mantuvo estable entre la primera y la segunda mitad.";
}

export default function SessionResults({ fecha, disparos, actions }: Props) {
  const stats = calcSessionStats(disparos);
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(
        contentRef.current,
        `minirifle-fbi_${fecha}_${stats.resultado}.pdf`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div ref={contentRef} className="flex flex-col gap-4 bg-background p-0.5">
        <div className="rounded-2xl border border-border bg-surface p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            {formatFecha(fecha)}
          </p>
          <p className="mt-2 text-4xl font-extrabold text-accent">{stats.resultado}</p>
          <p className="mt-1 text-sm text-foreground-muted">
            {stats.puntajeTotal} / {stats.sobre} puntos · {stats.impactos}/{stats.totalShots} impactos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Mejor ronda" value={`R${stats.bestRound.index + 1}`} sub={`${stats.bestRound.score} pts`} accent />
          <StatCard label="Peor ronda" value={`R${stats.worstRound.index + 1}`} sub={`${stats.worstRound.score} pts`} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Puntaje por ronda</h3>
          <RoundBarChart stats={stats} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Distribución de valores</h3>
          <ValueDistributionChart stats={stats} />
          <div className="mt-3 grid grid-cols-5 gap-2 text-center">
            {SHOT_VALUES.map((v) => (
              <div key={v}>
                <p className={`text-sm font-bold ${VALUE_TEXT_CLASS[v]}`}>{valueLabel(v)}</p>
                <p className="text-xs text-foreground-muted">
                  {stats.valuePercents[v].toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-sm">
            <Stat label="Media" value={stats.media.toFixed(2)} />
            <Stat label="Mediana" value={stats.mediana.toString()} />
            <Stat label="Moda" value={stats.moda.map(valueLabel).join(" / ")} />
            <Stat label="Racha máx. sin 0" value={`${stats.rachaMaxima} disparos`} />
            <Stat label="Consistencia (σ rondas)" value={stats.desvioEstandarRondas.toFixed(2)} />
            <Stat
              label="Ronda con más 0s"
              value={
                stats.rondaConMasCeros
                  ? `R${stats.rondaConMasCeros.index + 1} (${stats.rondaConMasCeros.zeros})`
                  : "Sin ceros"
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Primera mitad (R1–R4) vs segunda mitad (R5–R8)
          </h3>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-foreground-muted text-xs">1ª mitad</p>
              <p className="text-lg font-bold text-foreground">
                {stats.primeraMitadAvg.toFixed(1)}
              </p>
            </div>
            <span className="text-foreground-muted">→</span>
            <div className="text-right">
              <p className="text-foreground-muted text-xs">2ª mitad</p>
              <p className="text-lg font-bold text-foreground">
                {stats.segundaMitadAvg.toFixed(1)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            {mitadesMensaje(stats.diferenciaMitades)}
          </p>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="rounded-xl border border-accent/50 bg-accent-soft py-3 text-sm font-semibold text-accent disabled:opacity-50"
      >
        {exporting ? "Generando PDF…" : "Exportar a PDF"}
      </button>

      {actions}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-val-9" : "text-val-0"}`}>{value}</p>
      <p className="text-xs text-foreground-muted">{sub}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
