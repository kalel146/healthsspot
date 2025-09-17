// MacroBarChart.jsx — safe compat (keys: "Στόχος", "Πλάνο")
import React, { useMemo, useId } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function MacroBarChart({ data = [], theme = "light", tooltipFormatter }) {
  const isDark = theme === "dark";
  const gid = useId();

  const rows = useMemo(() => (Array.isArray(data) ? data : []).map(r => ({
    label: r?.label ?? "",
    "Στόχος": Number(r?.["Στόχος"]) || 0,
    "Πλάνο": Number(r?.["Πλάνο"]) || 0,
  })), [data]);

  if (!rows.length) {
    return <div className="w-full h-[280px] grid place-items-center text-sm opacity-70">Χωρίς δεδομένα.</div>;
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id={`${gid}-target`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id={`${gid}-plan`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.65} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e5e7eb"} />
          <XAxis dataKey="label" stroke={isDark ? "#a1a1aa" : "#4b5563"} tick={{ fontSize: 12 }} />
          <YAxis stroke={isDark ? "#a1a1aa" : "#4b5563"} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: isDark ? "#0b0b0c" : "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.5)" : "0 6px 24px rgba(0,0,0,0.08)",
            }}
            formatter={(v, n) => [tooltipFormatter ? tooltipFormatter(v) : v, n]}
          />

          <Bar dataKey="Στόχος" fill={`url(#${gid}-target)`} radius={[8,8,0,0]} />
          <Bar dataKey="Πλάνο" fill={`url(#${gid}-plan)`} radius={[8,8,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
