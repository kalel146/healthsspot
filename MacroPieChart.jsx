// MacroPieChart.jsx — safe compat
import React, { useMemo, useId } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function MacroPieChart({ pieData = [], theme = "light", colors }) {
  const isDark = theme === "dark";
  const gid = useId(); // unique ids => no gradient collisions

  const PALETTE = (colors && colors.length >= 3)
    ? colors
    : (isDark
      ? ["#fde047", "#34d399", "#60a5fa"] // yellow-300, emerald-400, blue-400
      : ["#f59e0b", "#10b981", "#0ea5e9"] // amber-600, emerald-500, sky-500
    );

  const data = useMemo(
    () => (Array.isArray(pieData) ? pieData : []).map(d => ({
      name: d?.name ?? "",
      value: Number(d?.value) || 0,
    })),
    [pieData]
  );
  const total = useMemo(() => data.reduce((a, d) => a + d.value, 0), [data]);

  if (!data.length || total <= 0) {
    return (
      <div className="w-full h-[260px] grid place-items-center text-sm opacity-70">
        Δεν υπάρχουν δεδομένα για εμφάνιση.
      </div>
    );
  }

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer>
        <PieChart>
          <defs>
            {PALETTE.slice(0, 3).map((col, i) => (
              <linearGradient key={i} id={`${gid}-slice-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={0.95} />
                <stop offset="100%" stopColor={col} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>

          <Pie
            data={data}
            innerRadius={70}
            outerRadius={105}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            stroke={isDark ? "#18181b" : "#ffffff"}
            strokeWidth={2}
            isAnimationActive
            animationDuration={350}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#${gid}-slice-${i})`} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: isDark ? "#0b0b0c" : "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.5)" : "0 6px 24px rgba(0,0,0,0.08)",
            }}
            formatter={(v, n) => [`${Math.round(v)}g (${((v/total)*100).toFixed(1)}%)`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
