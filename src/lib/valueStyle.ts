import { ShotValue } from "./types";

export const VALUE_HEX: Record<ShotValue, string> = {
  10: "#D4AF6A",
  9: "#8FAE6E",
  8: "#6E93AE",
  7: "#B0895A",
  0: "#C4362A",
};

export const VALUE_BG_CLASS: Record<ShotValue, string> = {
  10: "bg-val-10",
  9: "bg-val-9",
  8: "bg-val-8",
  7: "bg-val-7",
  0: "bg-val-0",
};

export const VALUE_TEXT_CLASS: Record<ShotValue, string> = {
  10: "text-val-10",
  9: "text-val-9",
  8: "text-val-8",
  7: "text-val-7",
  0: "text-val-0",
};

export function valueLabel(v: ShotValue): string {
  return v === 0 ? "0" : String(v);
}
