import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "./supabaseClient";


export default function ReportForm() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    sleep: "",
    energy: "",
    pain: "",
    notes: "",
    bmr: "",
    oneRM: "",
    vo2max: "",
    macros: ""
  });

  const [theme, setTheme] = useState("dark");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | local | syncing | synced | error

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);

    // Auto-fill values
    const lastBmr = localStorage.getItem("lastBMR");
    const last1RM = localStorage.getItem("last1RM");
    const lastVO2 = localStorage.getItem("lastVO2");
    setFormData((prev) => ({
      ...prev,
      bmr: lastBmr || "",
      oneRM: last1RM || "",
      vo2max: lastVO2 || ""
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSyncStatus("local");
    localStorage.setItem("customReport", JSON.stringify(formData));

    // Save key values for future auto-fill
    localStorage.setItem("lastBMR", formData.bmr);
    localStorage.setItem("last1RM", formData.oneRM);
    localStorage.setItem("lastVO2", formData.vo2max);

    if (user) {
      setSyncStatus("syncing");
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        ...formData
      });
      if (error) {
        console.error("Supabase error:", error);
        setSyncStatus("error");
      } else {
        setSyncStatus("synced");
      }
    } else {
      console.warn("No user signed in. Skipping Supabase sync.");
    }
  };

  const baseStyles = theme === "dark"
    ? "bg-gray-900 text-white"
    : "bg-white text-black";

  const inputStyles = theme === "dark"
    ? "bg-gray-800 text-white"
    : "bg-gray-200 text-black";

  const renderStatus = () => {
    switch (syncStatus) {
      case "local":
        return "🟢 Saved locally";
      case "syncing":
        return "🔄 Syncing...";
      case "synced":
        return "☁️ Synced to cloud";
      case "error":
        return "❌ Sync failed";
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-6 max-w-2xl mx-auto rounded shadow ${baseStyles}`}
    >
      <Helmet>
        <title>{user?.firstName ? `Report for ${user.firstName}` : "Create Weekly Report"} | Health's Spot</title>
        <meta
          name="description"
          content="Track sleep, energy, pain, BMR, VO2max, macros and personal notes with the weekly report form of Health's Spot."
        />
        <link rel="canonical" href="https://healthsspot.vercel.app/report" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": user?.firstName ? `Report for ${user.firstName}` : "Create Weekly Report | Health's Spot",
            "description":
              "Track weekly metrics like sleep, energy, pain, BMR, VO2max, macros and notes at Health's Spot.",
            "url": "https://healthsspot.vercel.app/report"
          })}
        </script>
      </Helmet>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📋 Create Weekly Report</h2>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
        >
          Toggle {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </div>

      {syncStatus !== "idle" && (
        <div className="mb-4 text-sm font-medium">
          {renderStatus()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="sleep"
          type="number"
          autoComplete="off"
          placeholder="Sleep Quality (1-10)"
          value={formData.sleep}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="energy"
          type="number"
          autoComplete="off"
          placeholder="Energy Level (1-10)"
          value={formData.energy}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="pain"
          type="number"
          autoComplete="off"
          placeholder="Pain Level (0-10)"
          value={formData.pain}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <textarea
          name="notes"
          autoComplete="off"
          placeholder="Additional Notes"
          value={formData.notes}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="bmr"
          autoComplete="off"
          placeholder="BMR (auto or manual)"
          value={formData.bmr}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="oneRM"
          autoComplete="off"
          placeholder="1RM (auto or manual)"
          value={formData.oneRM}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="vo2max"
          autoComplete="off"
          placeholder="VO2max (auto or manual)"
          value={formData.vo2max}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="macros"
          autoComplete="off"
          placeholder="Macros (P/C/F)"
          value={formData.macros}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={syncStatus === "syncing"}
          className="w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded font-bold"
        >
          {syncStatus === "syncing" ? "⏳ Saving..." : "Save Report"}
        </motion.button>
      </form>
    </motion.div>
  );
}
