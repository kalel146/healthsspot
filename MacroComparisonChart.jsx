// MacroComparisonChart.jsx — safe compat (keys: protein, fat, carbs)
import React, { useMemo, useId } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function MacroComparisonChart({ data = [], theme = "light", tooltipFormatter }) {
  const isDark = theme === "dark";
  const gid = useId();

  const rows = useMemo(() => (Array.isArray(data) ? data : []).map(r => ({
    label: r?.label ?? "",
    protein: Number(r?.protein) || 0,
    fat: Number(r?.fat) || 0,
    carbs: Number(r?.carbs) || 0,
  })), [data]);

  if (!rows.length) {
    return <div className="w-full h-[280px] grid place-items-center text-sm opacity-70">Χωρίς δεδομένα.</div>;
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id={`${gid}-prot`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id={`${gid}-fat`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id={`${gid}-carb`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.65} />
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
          <Legend
            wrapperStyle={{ paddingTop: 4 }}
            formatter={(v) =>
              v === "protein" ? "Πρωτεΐνη" :
              v === "fat" ? "Λίπος" :
              v === "carbs" ? "Υδατ." : v
            }
          />

          <Bar dataKey="protein" name="Πρωτεΐνη" fill={`url(#${gid}-prot)`} radius={[8,8,0,0]} />
          <Bar dataKey="fat" name="Λίπος" fill={`url(#${gid}-fat)`} radius={[8,8,0,0]} />
          <Bar dataKey="carbs" name="Υδατ." fill={`url(#${gid}-carb)`} radius={[8,8,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
