"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SessionStats } from "@/lib/stats";

type Props = {
  stats: SessionStats;
};

export default function RoundBarChart({ stats }: Props) {
  const avg = stats.rounds.reduce((s, r) => s + r.score, 0) / stats.rounds.length;
  const data = stats.rounds.map((r) => ({
    name: `R${r.index + 1}`,
    puntaje: r.score,
    isBest: r.index === stats.bestRound.index,
    isWorst: r.index === stats.worstRound.index && stats.worstRound.score !== stats.bestRound.score,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c3136" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#a3a9ad", fontSize: 11 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 50]}
            tick={{ fill: "#a3a9ad", fontSize: 11 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "#ffffff08" }}
            contentStyle={{
              background: "#1c2024",
              border: "1px solid #2c3136",
              borderRadius: 8,
              fontSize: 12,
              color: "#edede8",
            }}
            labelStyle={{ color: "#a3a9ad" }}
          />
          <ReferenceLine
            y={avg}
            stroke="#D4AF6A"
            strokeDasharray="4 4"
            label={{
              value: `prom ${avg.toFixed(1)}`,
              position: "insideTopRight",
              fill: "#D4AF6A",
              fontSize: 11,
            }}
          />
          <Bar dataKey="puntaje" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.isBest ? "#8FAE6E" : d.isWorst ? "#C4362A" : "#6E93AE"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
