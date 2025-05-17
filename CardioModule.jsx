import React, { useState } from "react";

export default function CardioModule() {
  const [mets, setMets] = useState(1);
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(30);
  const [kcal, setKcal] = useState(null);

  const [testType, setTestType] = useState("Cooper");
  const [distance, setDistance] = useState(2400);
  const [vo2max, setVo2max] = useState(null);

  const calculateKcal = () => {
    const vo2 = mets * 3.5 * weight; // mL/min
    const kcalPerMin = (vo2 * 5) / 1000;
    const total = kcalPerMin * duration;
    setKcal({ vo2: vo2.toFixed(1), total: total.toFixed(1) });
  };

  const calculateVO2max = () => {
    let result = 0;
    if (testType === "Cooper") {
      result = (distance - 504.9) / 44.73;
    }
    setVo2max(result.toFixed(1));
  };

  return (
    <div className="bg-black text-white min-h-screen px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Cardio Lab</h1>

      {/* METs to kcal */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Υπολογισμός kcal μέσω METs ➝ VO2 ➝ kcal</h2>
        <input
          type="number"
          value={mets}
          onChange={(e) => setMets(e.target.value)}
          placeholder="METs"
          className="bg-gray-800 text-white p-2 rounded w-full"
        />
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Βάρος (kg)"
          className="bg-gray-800 text-white p-2 rounded w-full"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Διάρκεια (λεπτά)"
          className="bg-gray-800 text-white p-2 rounded w-full"
        />
        <button
          onClick={calculateKcal}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Υπολόγισε kcal
        </button>
        {kcal && (
          <p>
            VO2: {kcal.vo2} mL/min | kcal: {kcal.total} kcal συνολικά
          </p>
        )}
      </section>

      {/* VO2max Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">VO2max Test</h2>
        <select
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded w-full"
        >
          <option value="Cooper">Cooper Test</option>
          <option value="Rockport">Rockport (μόνο UI)</option>
          <option value="Step">Step Test (μόνο UI)</option>
        </select>

        {testType === "Cooper" && (
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="Απόσταση σε μέτρα (12 λεπτά)"
            className="bg-gray-800 text-white p-2 rounded w-full"
          />
        )}

        <button
          onClick={calculateVO2max}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Υπολόγισε VO2max
        </button>

        {vo2max && <p>VO2max: {vo2max} mL/kg/min</p>}
      </section>
    </div>
  );
}
