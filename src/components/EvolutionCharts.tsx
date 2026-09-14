"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type EvolutionPoint = {
  fechaLabel: string;
  puntaje: number;
  pctDieces: number;
};

export function ScoreEvolutionChart({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c3136" vertical={false} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fill: "#a3a9ad", fontSize: 10 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 400]}
            tick={{ fill: "#a3a9ad", fontSize: 11 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "#1c2024",
              border: "1px solid #2c3136",
              borderRadius: 8,
              fontSize: 12,
              color: "#edede8",
            }}
            labelStyle={{ color: "#a3a9ad" }}
          />
          <Line
            type="monotone"
            dataKey="puntaje"
            stroke="#D4AF6A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#D4AF6A" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PctDiecesEvolutionChart({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c3136" vertical={false} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fill: "#a3a9ad", fontSize: 10 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#a3a9ad", fontSize: 11 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
            width={30}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: "#1c2024",
              border: "1px solid #2c3136",
              borderRadius: 8,
              fontSize: 12,
              color: "#edede8",
            }}
            labelStyle={{ color: "#a3a9ad" }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "10s"]}
          />
          <Line
            type="monotone"
            dataKey="pctDieces"
            stroke="#8FAE6E"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#8FAE6E" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
