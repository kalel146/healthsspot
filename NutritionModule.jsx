import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function NutritionModule() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState(1.55);
  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);
  const [protein, setProtein] = useState(2);
  const [fat, setFat] = useState(1);
  const [carbs, setCarbs] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const getProteinLabel = (value) => {
    if (value < 1.2) return "Χαμηλή πρόσληψη πρωτεΐνης (π.χ. καθιστικοί ενήλικες)";
    if (value < 2) return "Μέτρια πρόσληψη πρωτεΐνης (π.χ. fitness / υγιεινή διατροφή)";
    return "Υψηλή πρόσληψη πρωτεΐνης (π.χ. bodybuilding, εντατική άσκηση)";
  };

  const getFatLabel = (value) => {
    if (value < 0.6) return "Πολύ χαμηλά λιπαρά (προσοχή σε έλλειψη απαραίτητων λιπαρών οξέων)";
    if (value < 1.2) return "Μέτρια λιπαρά (ισορροπημένη διατροφή)";
    return "Υψηλή πρόσληψη λιπαρών (πιθανή αύξηση θερμιδικής πρόσληψης)";
  };

  const calculateNutrition = () => {
    const calculatedBmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    const calculatedTdee = calculatedBmr * activity;
    setBmr(calculatedBmr.toFixed(1));
    setTdee(calculatedTdee.toFixed(1));

    const kcalFromProtein = protein * weight * 4;
    const kcalFromFat = fat * weight * 9;
    const remainingKcal = calculatedTdee - (kcalFromProtein + kcalFromFat);
    const gCarbs = remainingKcal / 4;
    setCarbs(gCarbs.toFixed(1));
  };

  const inputStyle = `w-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
    theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
  }`;

  const sectionStyle = "bg-opacity-30 backdrop-blur-sm p-6 rounded-xl shadow-lg";

  const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];
  const pieData = [
    { name: "Protein", value: protein * weight },
    { name: "Fat", value: fat * weight },
    { name: "Carbs", value: carbs ? parseFloat(carbs) : 0 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-6 py-10 space-y-10 transition-colors duration-500 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Helmet>
        <title>Nutrition Module | Health's Spot</title>
        <meta
          name="description"
          content="Υπολόγισε BMR, TDEE και διατροφικούς στόχους στο Health's Spot Nutrition Module."
        />
        <link rel="canonical" href="https://healthsspot.vercel.app/nutrition" />
      </Helmet>

      <div className="max-w-xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow">
            Nutrition Lab
          </h1>
          <button
            onClick={toggleTheme}
            className="text-2xl hover:text-yellow-400 transition"
            title="Switch theme"
          >
            {theme === "dark" ? "☀" : "🌙"}
          </button>
        </div>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">Υπολογισμός BMR / TDEE</h2>
          <div className="space-y-4">
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Βάρος (kg)" className={`p-2 rounded ${inputStyle}`} />
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ύψος (cm)" className={`p-2 rounded ${inputStyle}`} />
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ηλικία" className={`p-2 rounded ${inputStyle}`} />
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={`p-2 rounded ${inputStyle}`}>
              <option value="male">Άνδρας</option>
              <option value="female">Γυναίκα</option>
            </select>
            <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className={`p-2 rounded ${inputStyle}`}>
              <option value={1.2}>Καθιστική ζωή</option>
              <option value={1.375}>Ελαφριά δραστηριότητα</option>
              <option value={1.55}>Μέτρια δραστηριότητα</option>
              <option value={1.725}>Έντονη δραστηριότητα</option>
              <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
            </select>
            <button onClick={calculateNutrition} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">
              Υπολόγισε
            </button>
            {bmr && tdee && (
              <p className="mt-2">
                <strong>BMR:</strong> {bmr} kcal | <strong>TDEE:</strong> {tdee} kcal
              </p>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">Διατροφικοί Στόχοι (Macros)</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Πρωτεΐνη (g/kg): {protein}</label>
              <input type="range" min="0.5" max="3" step="0.1" value={protein} onChange={(e) => setProtein(parseFloat(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-600 italic mt-1">{getProteinLabel(protein)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Λίπος (g/kg): {fat}</label>
              <input type="range" min="0.3" max="2" step="0.1" value={fat} onChange={(e) => setFat(parseFloat(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-600 italic mt-1">{getFatLabel(fat)}</p>
            </div>
            {carbs && (
              <>
                <p className="mt-2">
                  Πρωτεΐνη: {protein * weight}g | Λίπος: {fat * weight}g | Υδατάνθρακες: {carbs}g
                </p>
                <div className="w-full h-64 mt-4">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">AI Προτάσεις</h2>
          <div className="space-y-4 text-sm">
            {tdee && (
              <>
                <p>
                  ⚡ <strong>Συνολικές θερμίδες:</strong> {tdee} kcal. 
                  Προσαρμόστε ανάλογα με τον στόχο σας (μείωση, διατήρηση, αύξηση βάρους).
                </p>
                <p>
                  🍗 <strong>Πρωτεΐνη:</strong> {(protein * weight).toFixed(0)}g —
                  {protein >= 2 ? " ιδανική για ανάπτυξη μυϊκής μάζας." : protein >= 1.2 ? " επαρκής για υγιή λειτουργία και διατήρηση." : " χαμηλή, ίσως χρειάζεται ενίσχυση."}
                </p>
                <p>
                  🧈 <strong>Λίπος:</strong> {(fat * weight).toFixed(0)}g —
                  {fat >= 1.2 ? " πιθανή υπέρβαση λίπους." : fat >= 0.6 ? " εντός φυσιολογικών ορίων." : " πολύ χαμηλό, πρόσεχε για ορμονική υγεία."}
                </p>
                <p>
                  🍞 <strong>Υδατάνθρακες:</strong> {carbs}g — βασική πηγή ενέργειας. Προσάρμοσε ανάλογα με ένταση/όγκο προπόνησης.
                </p>
              </>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">Προτάσεις Ανά Στόχο</h2>
          <div className="space-y-3 text-sm">
            {tdee && (
              <>
                <p>🎯 <strong>Cut (Απώλεια Λίπους):</strong> Προτεινόμενο έλλειμμα ~15-25% → {(tdee * 0.75).toFixed(0)} kcal. Μείωσε υδατάνθρακες κυρίως, κράτησε πρωτεΐνη ψηλά για μυϊκή διατήρηση.</p>
                <p>⚖️ <strong>Maintain (Σταθερό Βάρος):</strong> Κράτησε πρόσληψη στο TDEE → {tdee} kcal. Ισορροπία macros, ευελιξία για lifestyle/απόδοση.</p>
                <p>💪 <strong>Bulk (Μυϊκή Ανάπτυξη):</strong> Προτεινόμενο surplus ~10-15% → {(tdee * 1.15).toFixed(0)} kcal. Αύξησε υδατάνθρακες κυρίως, μέτρια αύξηση λίπους.</p>
              </>
            )}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
