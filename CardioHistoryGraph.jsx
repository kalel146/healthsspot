import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchCardioLogs } from "./fetchCardioLogs";

export default function CardioHistoryGraph({ activityFilter }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const logs = await fetchCardioLogs(activityFilter);
      // Order ascending for time-based plotting
      const sorted = logs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setData(sorted);
    }
    load();
  }, [activityFilter]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
        📊 Ιστορικό VO2max & kcal
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="VO2"
            stroke="#3b82f6"
            name="VO2max (mL/kg/min)"
          />
          <Line
            type="monotone"
            dataKey="kcal"
            stroke="#10b981"
            name="Θερμίδες (kcal)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
