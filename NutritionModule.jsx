import React, { useState } from "react";

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

  return (
    <div className="bg-black text-white min-h-screen px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Nutrition Lab</h1>

      {/* BMR / TDEE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Υπολογισμός BMR / TDEE</h2>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Βάρος (kg)" className="bg-gray-800 text-white p-2 rounded w-full" />
        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ύψος (cm)" className="bg-gray-800 text-white p-2 rounded w-full" />
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ηλικία" className="bg-gray-800 text-white p-2 rounded w-full" />
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full">
          <option value="male">Άνδρας</option>
          <option value="female">Γυναίκα</option>
        </select>
        <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className="bg-gray-800 text-white p-2 rounded w-full">
          <option value={1.2}>Καθιστική ζωή</option>
          <option value={1.375}>Ελαφριά δραστηριότητα</option>
          <option value={1.55}>Μέτρια δραστηριότητα</option>
          <option value={1.725}>Έντονη δραστηριότητα</option>
          <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
        </select>
        <button onClick={calculateNutrition} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Υπολόγισε</button>
        {bmr && tdee && (
          <p>BMR: {bmr} kcal | TDEE: {tdee} kcal</p>
        )}
      </section>

      {/* Macros */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Διατροφικοί Στόχοι (Macros)</h2>
        <label>Πρωτεΐνη (g/kg):</label>
        <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
        <label>Λίπος (g/kg):</label>
        <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full" />
        {carbs && (
          <p>
            Πρωτεΐνη: {protein * weight}g | Λίπος: {fat * weight}g | Υδατάνθρακες: {carbs}g
          </p>
        )}
      </section>
    </div>
  );
}
