import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";

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

  const inputStyle = `p-2 rounded w-full ${
    theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
  }`;

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
      <h1 className="text-3xl font-bold text-yellow-400 text-center">
        Nutrition Lab
      </h1>

      <button
        onClick={toggleTheme}
        className="mb-6 text-sm underline hover:text-yellow-400"
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      {/* BMR / TDEE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Υπολογισμός BMR / TDEE</h2>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Βάρος (kg)"
          className={inputStyle}
        />
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="Ύψος (cm)"
          className={inputStyle}
        />
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Ηλικία"
          className={inputStyle}
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={inputStyle}
        >
          <option value="male">Άνδρας</option>
          <option value="female">Γυναίκα</option>
        </select>
        <select
          value={activity}
          onChange={(e) => setActivity(Number(e.target.value))}
          className={inputStyle}
        >
          <option value={1.2}>Καθιστική ζωή</option>
          <option value={1.375}>Ελαφριά δραστηριότητα</option>
          <option value={1.55}>Μέτρια δραστηριότητα</option>
          <option value={1.725}>Έντονη δραστηριότητα</option>
          <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
        </select>
        <button
          onClick={calculateNutrition}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Υπολόγισε
        </button>
        {bmr && tdee && (
          <p>
            <strong>BMR:</strong> {bmr} kcal | <strong>TDEE:</strong> {tdee} kcal
          </p>
        )}
      </section>

      {/* Macros */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Διατροφικοί Στόχοι (Macros)</h2>
        <label>Πρωτεΐνη (g/kg):</label>
        <input
          type="number"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          className={inputStyle}
        />
        <label>Λίπος (g/kg):</label>
        <input
          type="number"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          className={inputStyle}
        />
        {carbs && (
          <p>
            Πρωτεΐνη: {protein * weight}g | Λίπος: {fat * weight}g | Υδατάνθρακες: {carbs}g
          </p>
        )}
      </section>
    </motion.div>
  );
}
