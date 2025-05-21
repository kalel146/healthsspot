import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "../ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";

const supabase = createClient(
  "https://lfhnlalktlcjyhelblci.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sYWxrdGxjanloZWxibGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI4MjEsImV4cCI6MjA2MzQxODgyMX0.qxOxqg2ObJBUJF5vKcQclIHgJa_1wYGrmWtxSU4Amvg"
);

const COLORS = ["#3b82f6", "#10b981", "#facc15", "#f97316"];

export default function AdvancedMetrics() {
  const [form, setForm] = useState({
    week: "",
    bmr: "",
    vo2max: "",
    protein: "",
    carbs: "",
    fat: "",
    stress_monday: "",
    stress_tuesday: "",
    stress_wednesday: "",
    stress_thursday: "",
    stress_friday: "",
    stress_saturday: "",
    stress_sunday: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("metrics").insert([
      {
        user_id: user.id,
        ...Object.fromEntries(
          Object.entries(form).map(([key, val]) => [key, isNaN(val) ? val : Number(val)])
        ),
      },
    ]);

    if (error) return console.error("Insert error:", error);
    alert("✅ Metrics inserted!");
    setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
  };
  const { theme } = useTheme();
  const chartBg = theme === "dark" ? "#1f2937" : "#f3f4f6";
  const cardBg = theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black";

  const { user } = useUser();

  const [bmrData, setBmrData] = useState([]);
  const [vo2Data, setVo2Data] = useState([]);
  const [macroData, setMacroData] = useState([]);
  const [stressData, setStressData] = useState([]);

  useEffect(() => {
    if (!user) return;
    console.log("Clerk ID:", user?.id);
    const fetchMetrics = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("week");
      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      if (data && data.length > 0) {
        setBmrData(data.map(row => ({ week: `Week ${row.week}`, BMR: row.bmr })));
        setVo2Data(data.map(row => ({ week: `Week ${row.week}`, VO2max: row.vo2max })));
        setMacroData([
          { name: "Protein", value: data.at(-1).protein },
          { name: "Carbs", value: data.at(-1).carbs },
          { name: "Fat", value: data.at(-1).fat },
        ]);
        setStressData([
          { day: "Mon", level: data.at(-1).stress_monday },
          { day: "Tue", level: data.at(-1).stress_tuesday },
          { day: "Wed", level: data.at(-1).stress_wednesday },
          { day: "Thu", level: data.at(-1).stress_thursday },
          { day: "Fri", level: data.at(-1).stress_friday },
          { day: "Sat", level: data.at(-1).stress_saturday },
          { day: "Sun", level: data.at(-1).stress_sunday },
        ]);
      }
    };

    fetchMetrics();
  }, [user]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
        {/* BMR Line Chart */}
        <div className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h3 className="text-lg font-bold mb-2">📈 BMR Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bmrData} style={{ backgroundColor: chartBg }}>
              <XAxis dataKey="week" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip contentStyle={{ backgroundColor: chartBg, color: theme === "dark" ? "#fff" : "#000" }} />
              <Legend />
              <Line type="monotone" dataKey="BMR" stroke="#facc15" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* VO2max Line Chart */}
        <div className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h3 className="text-lg font-bold mb-2">📈 VO₂max Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vo2Data} style={{ backgroundColor: chartBg }}>
              <XAxis dataKey="week" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip contentStyle={{ backgroundColor: chartBg, color: theme === "dark" ? "#fff" : "#000" }} />
              <Legend />
              <Line type="monotone" dataKey="VO2max" stroke="#34d399" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Macros Pie Chart */}
        <div className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h3 className="text-lg font-bold mb-2">🥧 Macro Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart style={{ backgroundColor: chartBg }}>
              <Pie
                data={macroData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: chartBg, color: theme === "dark" ? "#fff" : "#000" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stress Level Bar Chart */}
        <div className={`p-4 rounded-xl shadow ${cardBg}`}>
          <h3 className="text-lg font-bold mb-2">📊 Stress Levels (Weekly)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stressData} style={{ backgroundColor: chartBg }}>
              <XAxis dataKey="day" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip contentStyle={{ backgroundColor: chartBg, color: theme === "dark" ? "#fff" : "#000" }} />
              <Legend />
              <Bar dataKey="level" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="col-span-full p-6 mt-10 rounded-xl shadow border border-gray-500 space-y-4">
        <h3 className="text-lg font-bold text-yellow-400">🆕 Add New Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(form).map((field) => (
            <input
              key={field}
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field.replace(/_/g, ' ')}
              className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-sm text-black dark:text-white"
            />
          ))}
        </div>
        <button type="submit" className="mt-4 px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-600">
          ➕ Submit Metrics
        </button>
      </form>
    </div>
  );
}
