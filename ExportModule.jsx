import React, { useState } from "react";

export default function ExportModule() {
  const [selected, setSelected] = useState({
    strength: true,
    cardio: true,
    nutrition: true,
    recovery: true,
  });

  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const toggleOption = (key) => {
    setSelected({ ...selected, [key]: !selected[key] });
  };

  return (
    <div className="bg-black text-white min-h-screen px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Export & Share</h1>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Επιλογή Περιεχομένου για Εξαγωγή</h2>
        {Object.keys(selected).map((key) => (
          <div key={key} className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selected[key]}
              onChange={() => toggleOption(key)}
              className="form-checkbox h-5 w-5 text-green-500"
            />
            <label className="capitalize text-lg">{key} data</label>
          </div>
        ))}
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Δημιουργία PDF
        </button>
        {exported && <p className="text-sm text-gray-400">PDF δημιουργήθηκε (mock)</p>}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Επιλογές Διαμοιρασμού</h2>
        <div className="flex flex-col space-y-3">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Αποθήκευση στο κινητό</button>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">Αποστολή με Email</button>
          <button className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded">Sync με Cloud</button>
        </div>
      </section>
    </div>
  );
}
