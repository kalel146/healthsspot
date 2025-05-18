import React, { useState } from "react";
import { Helmet } from "react-helmet";

export default function ReportForm() {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("customReport", JSON.stringify(formData));
    alert("📋 Report saved successfully!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-white rounded shadow">
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
      <h2 className="text-2xl font-bold mb-6">📋 Create Weekly Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="sleep"
          type="number"
          placeholder="Sleep Quality (1-10)"
          value={formData.sleep}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          name="energy"
          type="number"
          placeholder="Energy Level (1-10)"
          value={formData.energy}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          name="pain"
          type="number"
          placeholder="Pain Level (0-10)"
          value={formData.pain}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <textarea
          name="notes"
          placeholder="Additional Notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          name="bmr"
          placeholder="BMR (auto or manual)"
          value={formData.bmr}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          name="oneRM"
          placeholder="1RM (auto or manual)"
          value={formData.oneRM}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          name="vo2max"
          placeholder="VO2max (auto or manual)"
          value={formData.vo2max}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          name="macros"
          placeholder="Macros (P/C/F)"
          value={formData.macros}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800"
        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded font-bold"
        >
          Save Report
        </button>
      </form>
    </div>
  );
}
