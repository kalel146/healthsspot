import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
import { Sparkles, HeartPulse, Flame, Ruler, LineChart, FileText, Bot } from "lucide-react";
import { supabase } from "./supabaseClient";
import { LineChart as Chart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import CardioInsights from "./CardioInsights";

export default function CardioModule() {
  const [mets, setMets] = useState(1);
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(30);
  const [kcal, setKcal] = useState(null);
  const [activity, setActivity] = useState("Τρέξιμο");
  const [testType, setTestType] = useState("Cooper");
  const [distance, setDistance] = useState(2400);
  const [vo2max, setVo2max] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [history, setHistory] = useState([]);
  const [advice, setAdvice] = useState("");
  const chartRef = useRef(null);
const activities = ["Τρέξιμο", "Ποδήλατο", "Κολύμβηση", "HIIT", "Άλλο"];
  
const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("cardio_logs")
      .select("created_at, vo2, kcal")
      .order("created_at", { ascending: true });

    if (data) {
      const formatted = data.map((entry) => ({
        date: new Date(entry.created_at).toLocaleDateString("el-GR"),
        VO2: entry.vo2 ? Number(entry.vo2) : null,
        kcal: entry.kcal ? Number(entry.kcal) : null,
      }));
      setHistory(formatted);
      generateAdvice(formatted);
  };

  const generateAdvice = (data) => {
    const last3 = data.slice(-3).filter(d => d.VO2);
    if (last3.length < 2) {
      setAdvice("⚠️ Δεν υπάρχουν αρκετά δεδομένα για αξιολόγηση προόδου.");
      return;
    }

    const trend = last3[last3.length - 1].VO2 - last3[0].VO2;
    if (trend > 1.5) {
      setAdvice("🚀 Η VO2max σου βελτιώνεται! Συνέχισε έτσι και προσπάθησε να διατηρείς σταθερή συχνότητα.");
    } else if (trend < -1.5) {
      setAdvice("📉 Η VO2max έχει πέσει. Ξεκουράσου επαρκώς, δες τη διατροφή σου και μείωσε το training load.");
    } else {
      setAdvice("📊 Η VO2max παραμένει σταθερή. Ίσως είναι ώρα να ανεβάσεις την ένταση ή διάρκεια.");
    }
  };
  
    // Extra AI Σύγκριση εβδομάδων
    const weekMap = {};
    data.forEach((entry) => {
      const week = new Date(entry.date).toLocaleDateString("el-GR", { week: "numeric", year: "numeric" });
      if (!weekMap[week]) weekMap[week] = { vo2Sum: 0, kcalSum: 0, count: 0 };
      if (entry.VO2) weekMap[week].vo2Sum += entry.VO2;
      if (entry.kcal) weekMap[week].kcalSum += entry.kcal;
      weekMap[week].count++;
    });

    const sortedWeeks = Object.entries(weekMap)
      .map(([week, stats]) => ({
        week,
        avgVO2: stats.vo2Sum / stats.count,
        totalKcal: stats.kcalSum
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    if (sortedWeeks.length >= 2) {
      const last = sortedWeeks[sortedWeeks.length - 1];
      const prev = sortedWeeks[sortedWeeks.length - 2];
      const deltaVO2 = last.avgVO2 - prev.avgVO2;
      const deltaKcal = last.totalKcal - prev.totalKcal;
      setAdvice((prevAdvice) => `${prevAdvice}\n📈 Σύγκριση Εβδομάδων → VO2max: ${deltaVO2.toFixed(1)}, kcal: ${deltaKcal.toFixed(0)}`);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const calculateKcal = async () => {
    const vo2 = mets * 3.5 * weight;
    const kcalPerMin = (vo2 * 5) / 1000;
    const total = kcalPerMin * duration;
    const result = { vo2: vo2.toFixed(1), total: total.toFixed(1) };
    setKcal(result);

    await supabase.from("cardio_logs").insert({
      type: "kcal",
      mets,
      weight,
      duration,
      vo2: result.vo2,
      kcal: result.total,
      activity,
      created_at: new Date().toISOString()
    });

    fetchHistory();
  };

  const calculateVO2max = async () => {
    let result = 0;
    if (testType === "Cooper") {
      result = (distance - 504.9) / 44.73;
    }
    const fixed = result.toFixed(1);
    setVo2max(fixed);

    await supabase.from("cardio_logs").insert({
      type: "vo2max",
      test_type: testType,
      value: fixed,
      distance,
      activity,
      created_at: new Date().toISOString()
    });

    fetchHistory();
  };

  const handleExportPDF = async () => {
    const element = chartRef.current;
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save("cardio_report.pdf");
  };

  const inputClass = `p-3 rounded-xl shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}`;
  const sectionClass = "space-y-4 max-w-xl mx-auto p-6 bg-opacity-70 rounded-2xl shadow-lg";

  const SectionHeader = ({ icon, color, children }) => (
    <h2 className={`text-2xl font-semibold flex items-center gap-2 text-${color}-500`}>{icon} {children}</h2>
  );

  const LabeledInput = ({ id, label, value, onChange, placeholder }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );

  const handleExportCSV = () => {
    const rows = [
      ["Ημερομηνία", "VO2max", "kcal"]
    ];

    const filtered = history.filter(entry => {
      if (activity === "Όλα") return true;
      return entry.activity === activity;
    });

    filtered.forEach(entry => {
      rows.push([entry.date, entry.VO2 ?? "", entry.kcal ?? ""]);
    });
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "cardio_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`min-h-screen px-4 sm:px-8 py-12 space-y-14 transition-colors duration-300 ${theme === "dark" ? "bg-gradient-to-br from-black via-gray-900 to-black text-white" : "bg-gradient-to-br from-white via-gray-100 to-white text-black"}`}
    >
      <Helmet>
        <title>Cardio Module | Health's Spot</title>
        <meta name="description" content="Υπολόγισε METs, VO2max και θερμίδες στο Cardio Lab του Health’s Spot." />
        <meta name="keywords" content="cardio, vo2max, calories, fitness, METs" />
        <html lang="el" />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 animate-pulse" /> Cardio Lab
        </h1>
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-xl shadow font-semibold bg-yellow-400 text-black hover:bg-yellow-500 transition"
          title="Εναλλαγή Θέματος"
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>
      </div>

      <motion.section className={sectionClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <SectionHeader icon={<Flame className="w-5 h-5" />} color="green">
          Υπολογισμός kcal (MET ➝ VO2 ➝ kcal)
        </SectionHeader>

        <LabeledInput id="mets" label="METs" value={mets} onChange={(e) => setMets(e.target.value)} />
        <LabeledInput id="weight" label="Βάρος (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <LabeledInput id="duration" label="Διάρκεια (λεπτά)" value={duration} onChange={(e) => setDuration(e.target.value)} />

        <button onClick={calculateKcal} className="bg-green-600 hover:bg-green-700 px-5 py-2 mt-2 rounded-xl text-white shadow">
          Υπολόγισε kcal
        </button>

        {kcal && (
          <motion.p className="font-medium text-sm mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            VO2: <strong>{kcal.vo2}</strong> mL/min | kcal: <strong>{kcal.total}</strong> kcal συνολικά
          </motion.p>
        )}
      </motion.section>

      <motion.section className={sectionClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <SectionHeader icon={<Ruler className="w-5 h-5" />} color="blue">
          VO2max Test (Cooper)
        </SectionHeader>

       <div className="space-y-1">
  <span className="text-sm font-medium block">Τύπος Δραστηριότητας</span>
  <div className="flex flex-wrap gap-2">
    {activities.map((act) => (
      <button
        key={act}
        onClick={() => setActivity(act)}
        className={`px-4 py-2 rounded-full font-medium border ${
          activity === act
            ? "bg-yellow-400 text-black border-yellow-500"
            : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-400"
        }`}
      >
        {act}
      </button>
    ))}
  </div>
</div>


        <label htmlFor="vo2test" className="block text-sm font-medium">Επιλογή Τεστ VO2max</label>
        <select
          id="vo2test"
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          className={inputClass}
        >
          <option value="Cooper">Cooper Test</option>
          <option value="Rockport" disabled>Rockport (υπό ανάπτυξη)</option>
          <option value="Step" disabled>Step Test (υπό ανάπτυξη)</option>
        </select>

        {testType === "Cooper" && (
          <LabeledInput
            id="cooper-distance"
            label="Απόσταση σε μέτρα (12 λεπτά)"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="π.χ. 2400"
          />
        )}

        <button onClick={calculateVO2max} className="bg-blue-600 hover:bg-blue-700 px-5 py-2 mt-2 rounded-xl text-white shadow">
          Υπολόγισε VO2max
        </button>

        {vo2max && (
          <motion.p className="font-medium text-sm mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            VO2max: <strong>{vo2max}</strong> mL/kg/min
          </motion.p>
        )}
      </motion.section>

        <motion.section className="max-w-4xl mx-auto p-6 rounded-xl shadow-xl bg-white dark:bg-gray-900" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <SectionHeader icon={<LineChart className="w-5 h-5" />} color="yellow">
          Ιστορικό VO2max και kcal
        </SectionHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          {activities.map((act) => (
            <button
              key={act}
              onClick={() => setActivity(act)}
              className={`px-4 py-1 rounded-full text-sm font-medium border transition-all duration-200 ${
                activity === act
                  ? "bg-yellow-400 text-black border-yellow-600"
                  : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-400"
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <Chart data={history.filter(h => activity === "Όλα" || h.activity === activity)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="VO2" stroke="#3b82f6" name="VO2max (mL/kg/min)" />
            <Line type="monotone" dataKey="kcal" stroke="#10b981" name="kcal (συνολικά)" />
          </Chart>
        </ResponsiveContainer>

         {advice && (
          <motion.div className="mt-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl shadow-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4" /> {advice}
            </p>
          </motion.div>
        )}

        <button
          onClick={handleExportCSV}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </motion.section>
     
      <CardioInsights activity={activity} history={history} />

    </motion.div>
  );
}
