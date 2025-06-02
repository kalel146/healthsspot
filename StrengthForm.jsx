import React, { useState, useEffect } from "react";

export default function StrengthForm({ onSubmit }) {
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [rpe, setRPE] = useState("");
  const [notes, setNotes] = useState("");
const [oneRM, setOneRM] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const entry = {
      exercise,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      sets: parseInt(sets),
      rpe: parseFloat(rpe),
      notes,
      date: new Date().toISOString(),
    };
    onSubmit(entry);
    setExercise("");
    setWeight("");
    setReps("");
    setSets("");
    setRPE("");
    setNotes("");
    if (!weight || !reps || !rpe) {
  setError("Συμπλήρωσε όλα τα πεδία!");
  return;
}
{error && <p className="text-red-500 font-medium">{error}</p>}

  };

  useEffect(() => {
  if (weight && reps) {
    const est1RM = weight / (1.0278 - 0.0278 * reps);
    setOneRM(est1RM.toFixed(2));
  }
}, [weight, reps]);
{oneRM && (
  <p className="text-sm text-green-400">📈 Εκτίμηση 1RM: {oneRM} kg</p>
)}

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-neutral-700 shadow-md">
      <h2 className="text-xl font-semibold text-yellow-400">✍️ Χειροκίνητη Καταχώρηση</h2>
      <input type="text" placeholder="Άσκηση" value={exercise} onChange={(e) => setExercise(e.target.value)} className="w-full p-2 rounded bg-neutral-800 text-white" required />
      <input type="number" placeholder="Κιλά" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-2 rounded bg-neutral-800 text-white" required />
      <input type="number" placeholder="Επαναλήψεις" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full p-2 rounded bg-neutral-800 text-white" required />
      <input type="number" placeholder="Σετ" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full p-2 rounded bg-neutral-800 text-white" required />
      <input type="number" step="0.1" placeholder="RPE" value={rpe} onChange={(e) => setRPE(e.target.value)} className="w-full p-2 rounded bg-neutral-800 text-white" />
      <textarea placeholder="Σημειώσεις (προαιρετικό)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 rounded bg-neutral-800 text-white" rows={2} />
      <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded">
        Καταχώρηση
      </button>
    </form>
  );
}
