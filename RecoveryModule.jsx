import React, { useState } from "react";

export default function RecoveryModule() {
  const [inputs, setInputs] = useState({
    sleep: 3,
    energy: 3,
    pain: 3,
    mood: 3,
    stress: 3,
  });
  const [score, setScore] = useState(null);

  const handleChange = (key, value) => {
    setInputs({ ...inputs, [key]: value });
  };

  const calculateRecovery = () => {
    const adjustedPain = 6 - parseInt(inputs.pain);
    const total =
      parseInt(inputs.sleep) +
      parseInt(inputs.energy) +
      adjustedPain +
      parseInt(inputs.mood) +
      (6 - parseInt(inputs.stress));
    const avg = total / 5;
    setScore(avg.toFixed(1));
  };

  return (
    <div className="bg-black text-white min-h-screen px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Recovery Station</h1>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Self-Report Ερωτηματολόγιο</h2>
        {Object.entries(inputs).map(([key, val]) => (
          <div key={key} className="space-y-2">
            <label className="capitalize">{key}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={val}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full"
            />
            <div className="text-sm text-gray-400">Τρέχουσα τιμή: {val}</div>
          </div>
        ))}
        <button
          onClick={calculateRecovery}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Υπολόγισε Recovery Score
        </button>
        {score && (
          <p className="mt-4 text-lg">
            Recovery Score: <span className="font-bold">{score}</span>
          </p>
        )}
      </section>
    </div>
  );
}
