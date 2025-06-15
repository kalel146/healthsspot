// MacroComparisonChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MacroComparisonChart = ({ data, colors, tooltipFormatter }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Bar dataKey="protein" fill={colors?.protein || "#8884d8"} name="Πρωτεΐνη" />
          <Bar dataKey="fat" fill={colors?.fat || "#82ca9d"} name="Λίπος" />
          <Bar dataKey="carbs" fill={colors?.carbs || "#ffc658"} name="Υδατάνθρακες" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacroComparisonChart;
