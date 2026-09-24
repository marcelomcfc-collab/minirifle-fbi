"use client";

import { MoscaGrid, Shot } from "@/lib/types";
import { calcRoundScore, calcRoundZeros } from "@/lib/stats";
import { VALUE_BG_CLASS, valueLabel } from "@/lib/valueStyle";

type Props = {
  disparos: Shot[][];
  moscas?: MoscaGrid | null;
  // Si se omite, la grilla se muestra de solo lectura (sin poder tocar
  // cada disparo para editarlo) — se usa así en el detalle de una sesión
  // ya guardada, a diferencia de la carga de la sesión en curso.
  onOpenShot?: (round: number, shot: number) => void;
};

export default function ShotGrid({ disparos, moscas, onOpenShot }: Props) {
  const readOnly = !onOpenShot;

  return (
    <div className="flex flex-col gap-2">
      {disparos.map((round, rIdx) => {
        const loaded = round.filter((s) => s !== null) as number[];
        const complete = loaded.length === round.length;
        const score = complete ? calcRoundScore(round as never) : null;
        const zeros = calcRoundZeros(round.filter((s) => s !== null) as never);

        return (
          <div
            key={rIdx}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2"
          >
            <div className="w-7 shrink-0 text-center text-xs font-semibold text-foreground-muted">
              R{rIdx + 1}
            </div>
            <div className="grid flex-1 grid-cols-5 gap-1.5">
              {round.map((shot, sIdx) => {
                const isX = shot === 10 && !!moscas?.[rIdx]?.[sIdx];
                const chipClass = `flex aspect-square items-center justify-center rounded-lg text-sm font-bold ${
                  shot === null
                    ? "border border-dashed border-border bg-surface-2 text-foreground-muted"
                    : `${VALUE_BG_CLASS[shot]} text-[#14171A]`
                }`;
                const label = shot === null ? "" : isX ? "X" : valueLabel(shot);

                return readOnly ? (
                  <div key={sIdx} className={chipClass}>
                    {label}
                  </div>
                ) : (
                  <button
                    key={sIdx}
                    onClick={() => onOpenShot(rIdx, sIdx)}
                    className={`${chipClass} transition-transform active:scale-95`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="w-11 shrink-0 text-right">
              <div className="text-sm font-bold text-foreground">
                {score === null ? "–" : score}
              </div>
              {zeros > 0 && (
                <div className="text-[10px] text-val-0">{zeros}×0</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
