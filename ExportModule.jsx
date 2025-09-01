// ✅ Cleaned version with fixed JSX structure for PDF export
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "./supabaseClient";
import { useUser } from "@clerk/clerk-react";



export default function ExportModule() {
  const [selected, setSelected] = useState({
    strength: true,
    cardio: true,
    nutrition: true,
    recovery: true,
  });
  const [metrics, setMetrics] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const exportRef = useRef();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("week");
      if (!error) setMetrics(data);
    })();
  }, [user]);

  const handlePdfExport = async () => {
    try {
      const chartEl = document.getElementById("chart-section");
      const exportEl = exportRef.current;
      const chartCanvas = await html2canvas(chartEl, { scale: 2 });
      const chartImg = chartCanvas.toDataURL("image/png");
      document.getElementById("chart-image").src = chartImg;

      await new Promise((resolve) => setTimeout(resolve, 100));
      const fullCanvas = await html2canvas(exportEl, { scale: 2 });
      const imgData = fullCanvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("healths-spot-export.pdf");
    } catch (error) {
      alert("Αποτυχία δημιουργίας PDF. Δοκίμασε ξανά.");
      console.error("PDF Export Error:", error);
    }
  };

  const toggleOption = (key) => {
    setSelected({ ...selected, [key]: !selected[key] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-6 py-10 space-y-10 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Helmet>
        <title>Export Module | Health's Spot</title>
        <meta name="description" content="Επιλογές εξαγωγής και διαμοιρασμού δεδομένων στο Health's Spot." />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Export & Share</h1>
        <button
          onClick={toggleTheme}
          className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
        >
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6" id="chart-section">
        <section className="bg-opacity-10 border border-yellow-400 p-5 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Επιλογή Περιεχομένου για Εξαγωγή</h2>
          {Object.keys(selected).map((key) => (
            <div key={key} className="flex items-center space-x-4 mb-2">
              <input
                type="checkbox"
                checked={selected[key]}
                onChange={() => toggleOption(key)}
                className="h-5 w-5 accent-green-600"
              />
              <label className="capitalize text-lg">{key} data</label>
            </div>
          ))}

          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => {
                const dummy = [
                  {
                    week: 1,
                    bmr: 2000,
                    vo2max: 50,
                    protein: 150,
                    carbs: 300,
                    fat: 70,
                    stress_monday: 2,
                    stress_tuesday: 3,
                    stress_wednesday: 2,
                    stress_thursday: 4,
                    stress_friday: 1,
                    stress_saturday: 2,
                    stress_sunday: 3,
                  },
                  {
                    week: 2,
                    bmr: 2100,
                    vo2max: 52,
                    protein: 155,
                    carbs: 310,
                    fat: 72,
                    stress_monday: 3,
                    stress_tuesday: 2,
                    stress_wednesday: 3,
                    stress_thursday: 4,
                    stress_friday: 2,
                    stress_saturday: 2,
                    stress_sunday: 3,
                  },
                ];
                setMetrics(dummy);
                alert("✔️ Dummy data loaded for preview/export");
              }}
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded text-white font-medium"
            >
              Φόρτωση Δοκιμαστικών Δεδομένων
            </button>
            <button
              onClick={handlePdfExport}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
            >
              Λήψη PDF
            </button>
            <button
              onClick={() => {
                const headers = [
                  "Week",
                  "BMR",
                  "VO2max",
                  "Protein",
                  "Carbs",
                  "Fat",
                  "Stress_Mon",
                  "Stress_Tue",
                  "Stress_Wed",
                  "Stress_Thu",
                  "Stress_Fri",
                  "Stress_Sat",
                  "Stress_Sun",
                ];
                const rows = metrics.map((row) => [
                  row.week,
                  row.bmr,
                  row.vo2max,
                  row.protein,
                  row.carbs,
                  row.fat,
                  row.stress_monday,
                  row.stress_tuesday,
                  row.stress_wednesday,
                  row.stress_thursday,
                  row.stress_friday,
                  row.stress_saturday,
                  row.stress_sunday,
                ]);
                const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "healths-spot-export.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-medium"
            >
              Εξαγωγή CSV
            </button>
          </div>
        </section>

        <div
          ref={exportRef}
          id="pdf-content"
          style={{ position: "absolute", left: "-9999px", top: 0 }}
          className="p-6 bg-white text-black w-[210mm]"
        >
          <h1 className="text-2xl font-bold mb-4">Health's Spot - Αναφορά Μετρήσεων</h1>
          <table className="w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Week</th>
                {selected.strength && <th className="border px-2 py-1">BMR</th>}
                {selected.cardio && <th className="border px-2 py-1">VO₂max</th>}
                {selected.nutrition && (
                  <>
                    <th className="border px-2 py-1">Protein</th>
                    <th className="border px-2 py-1">Carbs</th>
                    <th className="border px-2 py-1">Fat</th>
                  </>
                )}
                {selected.recovery && (
                  <>
                    <th className="border px-2 py-1">Stress Mon</th>
                    <th className="border px-2 py-1">Stress Tue</th>
                    <th className="border px-2 py-1">Stress Wed</th>
                    <th className="border px-2 py-1">Stress Thu</th>
                    <th className="border px-2 py-1">Stress Fri</th>
                    <th className="border px-2 py-1">Stress Sat</th>
                    <th className="border px-2 py-1">Stress Sun</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => (
                <tr key={row.week}>
                  <td className="border px-2 py-1">{row.week}</td>
                  {selected.strength && <td className="border px-2 py-1">{row.bmr}</td>}
                  {selected.cardio && <td className="border px-2 py-1">{row.vo2max}</td>}
                  {selected.nutrition && (
                    <>
                      <td className="border px-2 py-1">{row.protein}</td>
                      <td className="border px-2 py-1">{row.carbs}</td>
                      <td className="border px-2 py-1">{row.fat}</td>
                    </>
                  )}
                  {selected.recovery && (
                    <>
                      <td className="border px-2 py-1">{row.stress_monday}</td>
                      <td className="border px-2 py-1">{row.stress_tuesday}</td>
                      <td className="border px-2 py-1">{row.stress_wednesday}</td>
                      <td className="border px-2 py-1">{row.stress_thursday}</td>
                      <td className="border px-2 py-1">{row.stress_friday}</td>
                      <td className="border px-2 py-1">{row.stress_saturday}</td>
                      <td className="border px-2 py-1">{row.stress_sunday}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 text-sm text-gray-700">
            Ημερομηνία εξαγωγής: {new Date().toLocaleDateString()}
          </p>
          <div id="chart-snapshot" className="mt-6">
            <p className="text-sm font-semibold text-gray-800">📸 Επισκόπηση Μετρήσεων (screenshot):</p>
            <img id="chart-image" src="" alt="chart preview" className="mt-2 max-w-full border border-gray-400" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
