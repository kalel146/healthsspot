import React, { useState, useRef } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportModule() {
  const [selected, setSelected] = useState({
    strength: true,
    cardio: true,
    nutrition: true,
    recovery: true,
  });
  const [exported, setExported] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const exportRef = useRef();

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handlePdfExport = async () => {
    try {
      const element = exportRef.current;
      await new Promise((resolve) => setTimeout(resolve, 100)); // μικρή καθυστέρηση για DOM rendering
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
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

      <div className="max-w-xl mx-auto space-y-6">
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
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-medium"
            >
              Δημιουργία PDF (mock)
            </button>
            <button
              onClick={handlePdfExport}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
            >
              Λήψη PDF
            </button>
          </div>

          {exported && (
            <p className="text-sm text-green-400 pt-2 font-semibold">
              ✅ PDF δημιουργήθηκε (mock)
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-purple-400">Επιλογές Διαμοιρασμού</h2>
          <div className="flex flex-col space-y-3">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium">
              Αποθήκευση στο κινητό
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-medium">
              Αποστολή με Email
            </button>
            <button className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded text-white font-medium">
              Sync με Cloud
            </button>
          </div>
        </section>

        {/* PDF Content for Screenshot */}
        <div
          ref={exportRef}
          id="pdf-content"
          style={{ position: "absolute", left: "-9999px", top: 0 }}
          className="p-6 bg-white text-black w-[210mm]"
        >
          <h1 className="text-2xl font-bold mb-4">Health's Spot - Επιλεγμένα Δεδομένα</h1>
          <ul className="list-disc pl-5 space-y-1">
            {Object.entries(selected).map(
              ([key, value]) => value && <li key={key}>{key.toUpperCase()} Module</li>
            )}
          </ul>
          <p className="mt-4 text-sm text-gray-700">Ημερομηνία εξαγωγής: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  );
}
