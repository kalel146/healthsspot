import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MacroBarChart = ({ data, colors, tooltipFormatter }) => {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Bar dataKey="Στόχος" fill={colors[0]} />
          <Bar dataKey="Πλάνο" fill={colors[1]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacroBarChart;
