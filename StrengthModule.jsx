import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
import { Info } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const supabase = createClient("https://your-project.supabase.co", "your-anon-key");

const pageVariants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -50, scale: 0.95 },
};

const pageTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function StrengthModule() {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(1);
  const [oneRM, setOneRM] = useState(null);
  const [error, setError] = useState("");
  const [rpe, setRpe] = useState("7");
  const [rir, setRir] = useState("3");
  const [rpeError, setRpeError] = useState("");
  const [stressData, setStressData] = useState({ sleep: 3, energy: 3, pain: 3, mood: 3 });
  const [recoveryScore, setRecoveryScore] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [logData, setLogData] = useState([]);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("strengthModuleData");
      if (saved) {
        const data = JSON.parse(saved);
        setWeight(data.weight || 0);
        setReps(data.reps || 1);
        setRpe(data.rpe || "7");
        setRir(data.rir || "3");
        setStressData(data.stressData || { sleep: 3, energy: 3, pain: 3, mood: 3 });
      }
    } catch (e) {
      console.error("Σφάλμα ανάκτησης δεδομένων από localStorage:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "strengthModuleData",
      JSON.stringify({ weight, reps, rpe, rir, stressData })
    );
  }, [weight, reps, rpe, rir, stressData]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("strength_logs")
        .select("timestamp, oneRM")
        .order("timestamp", { ascending: true });
      if (!error && data) setLogData(data);
    };
    fetchLogs();
  }, [oneRM]);

  const logToSupabase = async (type, data) => {
    const { error } = await supabase.from("strength_logs").insert([{ type, ...data, timestamp: new Date().toISOString() }]);
    if (error) console.error("Supabase logging error:", error);
  };


  const calculateOneRM = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || w <= 0 || r < 1 || r > 10) {
      setError("⚠ Συμπλήρωσε σωστά το βάρος (> 0) και τις επαναλήψεις (1-10).”");
      setOneRM(null);
      return;
    }
    setError("");
    const result = w * (36 / (37 - r));
    const final = result.toFixed(1);
    setOneRM(final);
    logToSupabase("1RM", { weight: w, reps: r, oneRM: final });
  };

  const handleRpeRirChange = (value, type) => {
    if (type === "rpe") {
      setRpe(value);
      setRpeError(parseInt(value) < 6 ? "⚠ Το RPE πρέπει να είναι ≥ 6." : "");
    } else if (type === "rir") {
      setRir(value);
      setRpeError(parseInt(value) > 4 ? "⚠ Το RIR πρέπει να είναι ≤ 4." : "");
    }
  };

  const calculateRecovery = () => {
    const score = (
      parseInt(stressData.sleep) +
      parseInt(stressData.energy) +
      (6 - parseInt(stressData.pain)) +
      parseInt(stressData.mood)
    ) / 4;
    const final = score.toFixed(1);
    setRecoveryScore(final);
    logToSupabase("Recovery", { ...stressData, recoveryScore: final });
  };

  const exportToCSV = () => {
    const rows = [
      ["Weight", `${weight} kg`],
      ["Reps", reps],
      ["1RM", oneRM || "Not calculated"],
      ["RPE", rpe],
      ["RIR", rir],
      ["Sleep", stressData.sleep],
      ["Energy", stressData.energy],
      ["Pain", stressData.pain],
      ["Mood", stressData.mood],
      ["Recovery Score", recoveryScore || "Not calculated"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "strength_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Health's Spot - Strength Report", 20, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: [
        ["Weight", `${weight} kg`],
        ["Reps", `${reps}`],
        ["1RM", oneRM ? `${oneRM} kg` : "Not calculated"],
        ["RPE", rpe],
        ["RIR", rir],
        ["Sleep", stressData.sleep],
        ["Energy", stressData.energy],
        ["Pain", stressData.pain],
        ["Mood", stressData.mood],
        ["Recovery Score", recoveryScore || "Not calculated"],
      ],
    });

    doc.save("strength_report.pdf");
  };

   const chartData = logData.map(entry => ({
    name: new Date(entry.timestamp).toLocaleDateString("el-GR"),
    oneRM: parseFloat(entry.oneRM)
  }));

  const stressLabels = {
    sleep: "Ύπνος",
    energy: "Ενέργεια",
    pain: "Μυϊκός Πόνος",
    mood: "Διάθεση",
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`min-h-screen px-4 py-10 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <Helmet>
        <title>Strength Training | Health's Spot</title>
        <meta name="description" content="Υπολόγισε 1RM, RPE και Recovery score για την προπόνησή σου στο Strength Lab του Health's Spot." />
        <link rel="canonical" href="https://healthsspot.vercel.app/training" />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Strength Lab</h1>
          <button
            onClick={toggleTheme}
            className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600"
          >
            📄 Εξαγωγή PDF
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
            📑 Εξαγωγή CSV
          </button>
        </div>
    

        <motion.section
          className="space-y-4 border border-yellow-500 p-5 rounded-xl"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-yellow-400">Υπολογισμός 1RM (Brzycki)</h2>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Βάρος (kg)"
            className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="Επαναλήψεις (1-10)"
            className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={calculateOneRM}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
          >
            Υπολόγισε 1RM
          </button>
          {error && <p className="text-red-500 font-semibold">{error}</p>}
          {oneRM && <p className="text-lg font-bold">1RM: {oneRM} kg</p>}
        </motion.section>

        <motion.section
          className="space-y-4 border border-purple-500 p-5 rounded-xl"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-purple-400 flex items-center gap-2">
            RPE / RIR Tool
            <Info className="w-4 h-4 text-purple-300" title="RPE: Εκτιμώμενη αντίληψη δυσκολίας (6–10). RIR: Πόσες επαναλήψεις μένουν πριν την εξάντληση (0–4)." />
          </h2>
          <div>
            <label className="block font-medium">RPE:</label>
            <select
              value={rpe}
              onChange={(e) => handleRpeRirChange(e.target.value, "rpe")}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i + 6}>{i + 6}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">RIR:</label>
            <select
              value={rir}
              onChange={(e) => handleRpeRirChange(e.target.value, "rir")}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          {rpeError && <p className="text-red-500 font-semibold">{rpeError}</p>}
        </motion.section>

        <motion.section
          className="space-y-4 border border-blue-500 p-5 rounded-xl"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
            Self-Report Recovery
            <Info className="w-4 h-4 text-blue-300" title="Recovery Score: Συνδυασμός ύπνου, ενέργειας, πόνου και διάθεσης (1-5). Όσο πιο ψηλό, τόσο καλύτερη η ανάκαμψη." />
          </h2>
          {Object.keys(stressData).map((key) => (
            <div key={key} className="space-y-1">
              <label className="block font-medium">{stressLabels[key]}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={stressData[key]}
                onChange={(e) =>
                  setStressData({ ...stressData, [key]: e.target.value })
                }
                className="w-full accent-blue-500"
              />
              <div className="text-sm text-gray-400">Τρέχουσα τιμή: {stressData[key]}</div>
            </div>
          ))}
          <button
            onClick={calculateRecovery}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
          >
            Υπολόγισε Recovery Score
          </button>
          {recoveryScore && (
            <p className="mt-2 text-lg font-bold text-blue-400">
              Recovery Score: {recoveryScore}
            </p>
          )}
        </motion.section>
        <motion.section
  className="space-y-4 border border-green-500 p-5 rounded-xl"
  variants={sectionVariants}
  initial="hidden"
  animate="visible"
  transition={{ duration: 0.5, delay: 0.3 }}
>
  <h2 className="text-xl font-semibold text-green-400">Ιστορικό 1RM</h2>
  {logData.length === 0 ? (
    <p className="text-gray-400">Δεν υπάρχουν δεδομένα ακόμα.</p>
  ) : (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={["auto", "auto"]} />
        <Tooltip />
        <Line type="monotone" dataKey="oneRM" stroke="#34D399" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  )}
</motion.section>
      </div>
    </motion.div>
  );
}
