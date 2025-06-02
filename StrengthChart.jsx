import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";


export default function StrengthChart({ data = [], prValue }) {
  return (
    <div className="bg-zinc-900/30 backdrop-blur-md shadow-md p-4 rounded-xl border border-neutral-700 mt-6">
      <h2 className="text-xl font-semibold text-green-400 mb-2">📈 Εξέλιξη 1RM</h2>
      {data.length === 0 ? (
        <p className="text-gray-400">Δεν υπάρχουν δεδομένα ακόμα.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="oneRM"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            {data.map((entry, index) =>
              parseFloat(entry.oneRM) === parseFloat(prValue) ? (
                <ReferenceDot
                  key={index}
                  x={entry.date}
                  y={entry.oneRM}
                  r={8}
                  stroke="#FFD700"
                  fill="#FFD700"
                  label={{
                    value: "🎯",
                    position: "top",
                    fontSize: 20,
                  }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
