import React, { useEffect, useMemo, useState } from "react";
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
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../supabaseClient";

const COLORS = ["#3b82f6", "#10b981", "#facc15", "#f97316"];

function MetricPanel({ title, subtitle, theme, hasData, children }) {
  const panelClass =
    theme === "dark"
      ? "bg-slate-900/76 text-white ring-1 ring-inset ring-white/6"
      : "bg-slate-50/94 text-slate-900 ring-1 ring-inset ring-slate-200/70";

  const chartWrapClass =
    theme === "dark"
      ? "bg-slate-800/58 ring-1 ring-inset ring-white/5"
      : "bg-slate-100/82 ring-1 ring-inset ring-slate-200/60";

  return (
    <div className={`rounded-2xl p-4 shadow-sm ${panelClass}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold md:text-base">{title}</h3>
          <p className={`mt-1 text-xs leading-5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${hasData ? "bg-emerald-400" : "bg-slate-500"}`} />
      </div>

      <div className={`rounded-xl p-2 ${chartWrapClass}`}>{children}</div>
    </div>
  );
}

function Field({ field, value, onChange, theme }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={field} className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {field.replace(/_/g, " ")}
      </label>
      <input
        id={field}
        name={field}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder={field.replace(/_/g, " ")}
        className={`rounded-xl px-3 py-2.5 text-sm outline-none transition ring-1 ring-inset ${
          theme === "dark"
            ? "bg-slate-900/90 text-white placeholder:text-slate-500 ring-slate-700/70 focus:ring-yellow-400/30 focus:bg-slate-900"
            : "bg-white text-slate-900 placeholder:text-slate-400 ring-slate-300/80 focus:ring-yellow-500/30"
        }`}
      />
    </div>
  );
}

export default function AdvancedMetrics() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const dismissOnboarding = () => setShowOnboarding(false);

  const { theme } = useTheme();
  const chartBg = theme === "dark" ? "#1f2937" : "#f3f4f6";
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
      setBmrData(data.map((row) => ({ week: `Week ${row.week ?? "?"}`, BMR: row.bmr ?? 0 })));
      setVo2Data(data.map((row) => ({ week: `Week ${row.week ?? "?"}`, VO2max: row.vo2max ?? 0 })));

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
      if (error.code === "42501" || error.message.includes("permission denied")) {
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

  const hasMetrics = bmrData.length || vo2Data.length || macroData.length || stressData.length;

  const formSections = useMemo(
    () => [
      {
        title: "Core markers",
        fields: ["week", "bmr", "vo2max", "protein", "carbs", "fat"],
      },
      {
        title: "Stress inputs",
        fields: [
          "stress_monday",
          "stress_tuesday",
          "stress_wednesday",
          "stress_thursday",
          "stress_friday",
          "stress_saturday",
          "stress_sunday",
        ],
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-slate-900/68 ring-1 ring-inset ring-yellow-400/14" : "bg-yellow-50/90 ring-1 ring-inset ring-yellow-500/18"}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-bold text-yellow-400">🧠 Metrics discipline</div>
              <p className={`mt-2 text-xs leading-6 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                Το dashboard βγάζει νόημα όταν τα metrics μπαίνουν κάθε εβδομάδα με συνέπεια. Όχι όποτε το θυμηθείς επειδή ξαφνικά σε έπιασε επιστημονικός οίστρος.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissOnboarding}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                theme === "dark"
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              Hide note
            </button>
          </div>
        </div>
      )}

      {!hasMetrics && (
        <div className={`rounded-2xl p-4 text-sm ${theme === "dark" ? "bg-slate-900/66 text-slate-300 ring-1 ring-inset ring-white/6" : "bg-slate-50/88 text-slate-600 ring-1 ring-inset ring-slate-200/70"}`}>
          Δεν υπάρχουν αρκετά metrics ακόμα. Πέρασε εβδομαδιαίες τιμές παρακάτω και τα charts θα αρχίσουν να έχουν παλμό αντί για άδειο ντεκόρ.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <MetricPanel title="📈 BMR Trend" subtitle="Weekly energy baseline" theme={theme} hasData={bmrData.length > 0}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bmrData} style={{ backgroundColor: chartBg }}>
              <XAxis dataKey="week" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
              <Legend />
              <Line type="monotone" dataKey="BMR" stroke="#facc15" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </MetricPanel>

        <MetricPanel title="📈 VO₂max Trend" subtitle="Cardiorespiratory capacity" theme={theme} hasData={vo2Data.length > 0}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={vo2Data} style={{ backgroundColor: chartBg }}>
              <XAxis dataKey="week" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
              <Legend />
              <Line type="monotone" dataKey="VO2max" stroke="#34d399" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </MetricPanel>

        <MetricPanel title="🥧 Macro Breakdown" subtitle="Latest logged macro split" theme={theme} hasData={macroData.length > 0}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart style={{ backgroundColor: chartBg }}>
              <Pie
                data={macroData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={82}
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
        </MetricPanel>

        <MetricPanel title="📊 Stress Levels (Weekly)" subtitle="Latest perceived weekly load" theme={theme} hasData={stressData.length > 0}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stressData} style={{ backgroundColor: chartBg }}>
              <XAxis dataKey="day" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip contentStyle={{ backgroundColor: chartBg }} />
              <Legend />
              <Bar dataKey="level" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </MetricPanel>
      </div>

      <form onSubmit={handleSubmit} className={`rounded-[24px] p-5 md:p-6 ${theme === "dark" ? "bg-slate-950/76 ring-1 ring-inset ring-white/6" : "bg-white/90 ring-1 ring-inset ring-slate-200/70"}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Metric entry</div>
            <h3 className="mt-1 text-xl font-black text-yellow-400">🆕 Add New Metrics</h3>
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
              Κατέγραψε εβδομαδιαίες τιμές για βασικούς δείκτες. Σταθερή καταγραφή &gt; τέλειο dashboard χωρίς δεδομένα.
            </p>
          </div>
          <div className={`rounded-2xl px-4 py-3 text-sm ${theme === "dark" ? "bg-slate-900/72 text-slate-300 ring-1 ring-inset ring-white/6" : "bg-slate-50/90 text-slate-600 ring-1 ring-inset ring-slate-200/70"}`}>
            Recommended cadence: <span className="font-bold text-yellow-400">1 update / week</span>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {formSections.map((section) => (
            <div key={section.title}>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{section.title}</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {section.fields.map((field) => (
                  <Field
                    key={field}
                    field={field}
                    value={form[field]}
                    onChange={handleInputChange}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Source: weekly manual entries stored in Supabase.
          </div>
          <button
            type="submit"
            className="rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-600"
          >
            ➕ Submit Metrics
          </button>
        </div>
      </form>
    </div>
  );
}
