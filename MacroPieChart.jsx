import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function MacroPieChart({ pieData, colors, theme = "light" }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: theme === "dark" ? "#18181b" : "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
            labelStyle={{ color: theme === "dark" ? "#e4e4e7" : "#111827" }}
            formatter={(v, n) => [`${v} g`, n]}
          />

          <Legend
            verticalAlign="bottom"
            height={28}
            wrapperStyle={{
              fontSize: 12,
              color: theme === "dark" ? "#e4e4e7" : "#111827",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
