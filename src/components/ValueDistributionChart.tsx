"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SHOT_VALUES } from "@/lib/types";
import { SessionStats } from "@/lib/stats";
import { VALUE_HEX, valueLabel } from "@/lib/valueStyle";

type Props = {
  stats: SessionStats;
};

export default function ValueDistributionChart({ stats }: Props) {
  const data = SHOT_VALUES.map((v) => ({
    name: valueLabel(v),
    cantidad: stats.valueCounts[v],
    pct: stats.valuePercents[v],
    value: v,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#a3a9ad", fontSize: 12 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#a3a9ad", fontSize: 11 }}
            axisLine={{ stroke: "#2c3136" }}
            tickLine={false}
            width={28}
            allowDecimals={false}
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
            formatter={(value, _name, item) => [
              `${value} (${(item.payload as { pct: number }).pct.toFixed(1)}%)`,
              "Cantidad",
            ]}
            labelStyle={{ color: "#a3a9ad" }}
          />
          <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={VALUE_HEX[d.value]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
