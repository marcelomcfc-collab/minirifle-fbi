import { MoscaGrid, ROUNDS, SHOT_VALUES, SHOTS_PER_ROUND, ShotValue } from "./types";

export type RoundStat = {
  index: number; // 0-based
  score: number;
  zeros: number;
};

export type ValueCounts = Record<ShotValue, number>;

export type SessionStats = {
  totalShots: number;
  impactos: number;
  puntajeTotal: number;
  resultado: string; // "38-340"
  sobre: number; // 400
  rounds: RoundStat[];
  bestRound: RoundStat;
  worstRound: RoundStat;
  valueCounts: ValueCounts;
  valuePercents: Record<ShotValue, number>;
  media: number;
  mediana: number;
  moda: ShotValue[];
  rachaMaxima: number;
  desvioEstandarRondas: number;
  primeraMitadAvg: number;
  segundaMitadAvg: number;
  diferenciaMitades: number;
  rondaConMasCeros: { index: number; zeros: number } | null;
  moscasCount: number;
};

export function calcRoundScore(round: ShotValue[]): number {
  return round.reduce<number>((sum, v) => sum + v, 0);
}

export function calcRoundZeros(round: ShotValue[]): number {
  return round.filter((v) => v === 0).length;
}

export function calcSessionStats(
  disparos: ShotValue[][],
  moscas?: MoscaGrid | null
): SessionStats {
  const flat = disparos.flat();
  const totalShots = flat.length;

  const rounds: RoundStat[] = disparos.map((round, index) => ({
    index,
    score: calcRoundScore(round),
    zeros: calcRoundZeros(round),
  }));

  const puntajeTotal: number = flat.reduce<number>((sum, v) => sum + v, 0);
  const impactos = flat.filter((v) => v > 0).length;

  const bestRound = rounds.reduce((best, r) => (r.score > best.score ? r : best), rounds[0]);
  const worstRound = rounds.reduce((worst, r) => (r.score < worst.score ? r : worst), rounds[0]);

  const valueCounts = SHOT_VALUES.reduce((acc, v) => {
    acc[v] = flat.filter((s) => s === v).length;
    return acc;
  }, {} as ValueCounts);

  const valuePercents = SHOT_VALUES.reduce((acc, v) => {
    acc[v] = totalShots > 0 ? (valueCounts[v] / totalShots) * 100 : 0;
    return acc;
  }, {} as Record<ShotValue, number>);

  const media = totalShots > 0 ? puntajeTotal / totalShots : 0;

  const sorted = [...flat].sort((a, b) => a - b);
  const mediana =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

  const maxCount = Math.max(...SHOT_VALUES.map((v) => valueCounts[v]));
  const moda = SHOT_VALUES.filter((v) => valueCounts[v] === maxCount && maxCount > 0);

  let rachaMaxima = 0;
  let rachaActual = 0;
  for (const v of flat) {
    if (v > 0) {
      rachaActual += 1;
      rachaMaxima = Math.max(rachaMaxima, rachaActual);
    } else {
      rachaActual = 0;
    }
  }

  const roundScores = rounds.map((r) => r.score);
  const avgRoundScore = roundScores.reduce((s, v) => s + v, 0) / (roundScores.length || 1);
  const variance =
    roundScores.reduce((s, v) => s + (v - avgRoundScore) ** 2, 0) / (roundScores.length || 1);
  const desvioEstandarRondas = Math.sqrt(variance);

  const half = Math.floor(ROUNDS / 2);
  const primeraMitad = rounds.slice(0, half);
  const segundaMitad = rounds.slice(half);
  const primeraMitadAvg =
    primeraMitad.reduce((s, r) => s + r.score, 0) / (primeraMitad.length || 1);
  const segundaMitadAvg =
    segundaMitad.reduce((s, r) => s + r.score, 0) / (segundaMitad.length || 1);

  const roundsWithZeros = rounds.filter((r) => r.zeros > 0);
  const maxZeros = roundsWithZeros.length > 0 ? Math.max(...roundsWithZeros.map((r) => r.zeros)) : 0;
  const rondaConMasCeros =
    roundsWithZeros.length > 0
      ? (() => {
          const r = roundsWithZeros.find((r) => r.zeros === maxZeros)!;
          return { index: r.index, zeros: r.zeros };
        })()
      : null;

  const moscasCount = moscas
    ? moscas.reduce((sum, round) => sum + round.filter(Boolean).length, 0)
    : 0;

  return {
    totalShots,
    impactos,
    puntajeTotal,
    resultado: `${impactos}-${puntajeTotal}`,
    sobre: totalShots > 0 ? totalShots * 10 : ROUNDS * SHOTS_PER_ROUND * 10,
    rounds,
    bestRound,
    worstRound,
    valueCounts,
    valuePercents,
    media,
    mediana,
    moda,
    rachaMaxima,
    desvioEstandarRondas,
    primeraMitadAvg,
    segundaMitadAvg,
    diferenciaMitades: segundaMitadAvg - primeraMitadAvg,
    rondaConMasCeros,
    moscasCount,
  };
}

export type Trend = "mejorando" | "estable" | "bajando";

export function calcTrend(scores: number[]): Trend {
  if (scores.length < 2) return "estable";
  const n = scores.length;
  const xs = scores.map((_, i) => i);
  const xMean = xs.reduce((s, v) => s + v, 0) / n;
  const yMean = scores.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (scores[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  if (slope > 0.75) return "mejorando";
  if (slope < -0.75) return "bajando";
  return "estable";
}
