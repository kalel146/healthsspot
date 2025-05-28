import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
import { Sparkles, HeartPulse, Flame, Ruler, LineChart, FileText } from "lucide-react";
import { supabase } from "./supabaseClient";
import { LineChart as Chart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CardioModule() {
  const [mets, setMets] = useState(1);
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(30);
  const [kcal, setKcal] = useState(null);

  const [testType, setTestType] = useState("Cooper");
  const [distance, setDistance] = useState(2400);
  const [vo2max, setVo2max] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const [history, setHistory] = useState([]);
  const chartRef = useRef(null);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("cardio_logs")
      .select("created_at, vo2, kcal")
      .order("created_at", { ascending: true });

    if (data) {
      setHistory(
        data.map((entry) => ({
          date: new Date(entry.created_at).toLocaleDateString("el-GR"),
          VO2: entry.vo2 ? Number(entry.vo2) : null,
          kcal: entry.kcal ? Number(entry.kcal) : null,
        }))
      );
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
        <ResponsiveContainer width="100%" height={300}>
          <Chart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="VO2" stroke="#3b82f6" name="VO2max (mL/kg/min)" />
            <Line type="monotone" dataKey="kcal" stroke="#10b981" name="kcal (συνολικά)" />
          </Chart>
        </ResponsiveContainer>
      </motion.section>
      
    </motion.div>
  );
}
