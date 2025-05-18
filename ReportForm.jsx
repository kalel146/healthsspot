import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://your-project-id.supabase.co", // REPLACE with your Supabase URL
  "your-public-anon-key" // REPLACE with your Supabase anon key
);

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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
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
    localStorage.setItem("customReport", JSON.stringify(formData));
    alert("📋 Report saved locally!");

    if (user) {
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        ...formData
      });
      if (error) {
        console.error("Supabase error:", error);
        alert("❌ Failed to sync to cloud.");
      } else {
        alert("☁️ Synced to Supabase successfully!");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-6 max-w-2xl mx-auto rounded shadow ${baseStyles}`}
    >
      <Helmet>
        <title>Create Weekly Report | Health's Spot</title>
        <meta
          name="description"
          content="Track sleep, energy, pain, BMR, VO2max, macros and personal notes with the weekly report form of Health's Spot."
        />
        <link rel="canonical" href="https://healthsspot.vercel.app/report" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Create Weekly Report | Health's Spot",
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="sleep"
          type="number"
          placeholder="Sleep Quality (1-10)"
          value={formData.sleep}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="energy"
          type="number"
          placeholder="Energy Level (1-10)"
          value={formData.energy}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="pain"
          type="number"
          placeholder="Pain Level (0-10)"
          value={formData.pain}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <textarea
          name="notes"
          placeholder="Additional Notes"
          value={formData.notes}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="bmr"
          placeholder="BMR (auto or manual)"
          value={formData.bmr}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="oneRM"
          placeholder="1RM (auto or manual)"
          value={formData.oneRM}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="vo2max"
          placeholder="VO2max (auto or manual)"
          value={formData.vo2max}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />
        <input
          name="macros"
          placeholder="Macros (P/C/F)"
          value={formData.macros}
          onChange={handleChange}
          className={`w-full p-2 rounded ${inputStyles}`}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded font-bold"
        >
          Save Report
        </motion.button>
      </form>
    </motion.div>
  );
}
