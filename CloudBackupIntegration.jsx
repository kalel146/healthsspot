import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";

export default function CloudBackupIntegration() {
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [status, setStatus] = useState("");
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    setCloudEnabled((prev) => !prev);
    setStatus("⏳ Σύνδεση σε εξέλιξη...");
    setTimeout(() => {
      setStatus("✅ Επιτυχής συγχρονισμός με Cloud Backup (mock)");
    }, 2000);
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
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Cloud Backup</h1>

      <button
        onClick={toggleTheme}
        className="block mx-auto text-sm underline hover:text-yellow-400"
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      <section className="space-y-4 text-center">
        <p className="text-lg">
          Ενεργοποίησε το αυτόματο συγχρονισμό με Google Drive ή iCloud
        </p>
        <button
          onClick={handleToggle}
          className={`px-6 py-3 rounded font-bold text-white transition ${
            cloudEnabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {cloudEnabled ? "Απενεργοποίηση Cloud Sync" : "Ενεργοποίηση Cloud Sync"}
        </button>
        <p className="text-sm text-gray-400 mt-4">{status}</p>
      </section>

      <section className="mt-10 text-center">
        <h2 className="text-xl font-semibold mb-4">Mock Αρχείο προς Συγχρονισμό</h2>
        <div
          className={`p-4 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-200"
          }`}
        >
          <p>📁 Filename: <strong>user_data_backup.json</strong></p>
          <p>📦 Περιεχόμενο: [μετρήσεις, πλάνα διατροφής, self-reports κ.ά.]</p>
        </div>
      </section>
    </motion.div>
  );
}
