"use client";

import { SHOT_VALUES, Shot, ShotValue } from "@/lib/types";
import { VALUE_BG_CLASS, valueLabel } from "@/lib/valueStyle";

type Props = {
  round: number;
  shot: number;
  currentValue: Shot;
  onSelect: (value: ShotValue) => void;
  onClose: () => void;
};

export default function ShotPicker({ round, shot, currentValue, onSelect, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border-t border-border bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Ronda {round + 1} · Disparo {shot + 1}
            </p>
            <p className="text-sm text-foreground-muted">Elegí el valor del disparo</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full border border-border p-2 text-foreground-muted"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {SHOT_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => onSelect(v)}
              className={`${VALUE_BG_CLASS[v]} flex aspect-square flex-col items-center justify-center rounded-xl text-2xl font-bold text-[#14171A] transition-transform active:scale-95 ${
                currentValue === v ? "ring-4 ring-foreground/70" : ""
              }`}
            >
              {valueLabel(v)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-foreground-muted">
          0 = fuera del blanco / no impactó
        </p>
      </div>
    </div>
  );
}
