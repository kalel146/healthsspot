import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

/**
 * Props:
 *  - data: [{ label: "Πρωτεΐνη", "Στόχος": number, "Πλάνο": number }, ...]
 *  - colors: string[] (θα αγνοηθούν, βάζουμε safe/defaults)
 *  - tooltipFormatter?: (value) => string
 *  - theme?: "light" | "dark"
 */
export default function MacroBarChart({
  data = [],
  colors = [],
  tooltipFormatter = (v) => `${v}g`,
  theme = "light",
}) {
  const axisColor = theme === "dark" ? "#a1a1aa" : "#4b5563";
  const gridColor = theme === "dark" ? "#27272a" : "#e5e7eb";
  const tooltipBg = theme === "dark" ? "#18181b" : "#ffffff";
  const tooltipLabel = theme === "dark" ? "#e4e4e7" : "#111827";

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 12, right: 20, bottom: 4, left: 0 }}
          barCategoryGap={20}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="label"
            stroke={axisColor}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: axisColor }}
          />
          <YAxis
            stroke={axisColor}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: axisColor }}
          />
          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
            labelStyle={{ color: tooltipLabel }}
            formatter={(v, n) => [tooltipFormatter(v), n]}
          />
          <Legend
            verticalAlign="top"
            height={24}
            wrapperStyle={{ fontSize: 12, color: axisColor }}
          />

          {/* Χρώματα: διακριτά & ουδέτερα */}
          <Bar
            dataKey="Στόχος"
            fill="#94a3b8" /* slate-400 */
            barSize={24}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="Πλάνο"
            fill="#facc15" /* yellow-400 */
            barSize={24}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
