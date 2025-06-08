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
  const [showOnboarding, setShowOnboarding] = useState(true);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
  };
  const { theme } = useTheme();
  const chartBg = theme === "dark" ? "#1f2937" : "#f3f4f6";
  const cardBg = theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black";
  const { user } = useUser();

  const [form, setForm] = useState({
    week: 1,
    bmr: 0,
    vo2max: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    stress_monday: 0,
    stress_tuesday: 0,
    stress_wednesday: 0,
    stress_thursday: 0,
    stress_friday: 0,
    stress_saturday: 0,
    stress_sunday: 0,
  });

  const [bmrData, setBmrData] = useState([]);
  const [vo2Data, setVo2Data] = useState([]);
  const [macroData, setMacroData] = useState([]);
  const [stressData, setStressData] = useState([]);

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
      setBmrData(data.map((row) => ({ week: `Week ${row.week ?? '?'}`, BMR: row.bmr ?? 0 })));
      setVo2Data(data.map((row) => ({ week: `Week ${row.week ?? '?'}`, VO2max: row.vo2max ?? 0 })));

        setMacroData([
  { name: "Protein", value: data.at(-1).protein ?? 0 },
  { name: "Carbs", value: data.at(-1).carbs ?? 0 },
  { name: "Fat", value: data.at(-1).fat ?? 0 },
]);
      setStressData([
  { day: "Mon", level: data.at(-1).stress_monday ?? 0 },
  { day: "Tue", level: data.at(-1).stress_tuesday ?? 0 },
  { day: "Wed", level: data.at(-1).stress_wednesday ?? 0 },
  { day: "Thu", level: data.at(-1).stress_thursday ?? 0 },
  { day: "Fri", level: data.at(-1).stress_friday ?? 0 },
  { day: "Sat", level: data.at(-1).stress_saturday ?? 0 },
  { day: "Sun", level: data.at(-1).stress_sunday ?? 0 },
]);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMetrics();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("metrics").insert([
      {
        user_id: user.id,
        ...form,
      },
    ]);
    if (error) {
      if (error.code === '42501' || error.message.includes("permission denied")) {
        alert("🔒 Δεν επιτρέπεται η καταγραφή. Ίσως είναι ενεργό το RLS ή δεν έχεις τα δικαιώματα.");
      } else {
        alert("❌ Error inserting metrics. Check console.");
      }
      console.error("Insert error:", error);
      return;
    }
    alert("✅ Metrics inserted!");
    fetchMetrics();
  };

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
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
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
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
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
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
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
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
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
    <div key={field} className="flex flex-col">
      <label htmlFor={field} className="text-xs text-gray-400 dark:text-gray-300 mb-1 capitalize">
        {field.replace(/_/g, " ")}
      </label>
      <input
        id={field}
        name={field}
        value={form[field]}
        onChange={handleInputChange}
        placeholder={field.replace(/_/g, " ")}
        className={`px-3 py-2 rounded text-sm ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} border border-gray-400`}
      />
    </div>
  ))}
</div>
        <button type="submit" className="mt-4 px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-600">
          ➕ Submit Metrics
        </button>
      </form>
    </div>
  );
}
