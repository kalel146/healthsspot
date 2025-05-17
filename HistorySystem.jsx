import React, { useState, useEffect } from "react";

export default function HistorySystem() {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("healths_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [entry, setEntry] = useState("");

  const addEntry = () => {
    const newEntry = {
      text: entry,
      date: new Date().toLocaleString(),
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem("healths_history", JSON.stringify(updated));
    setEntry("");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("healths_history");
  };

  return (
    <div className="bg-black text-white min-h-screen px-6 py-10">
      <h1 className="text-3xl font-bold text-yellow-400 text-center mb-8">Ιστορικό Καταγραφών</h1>

      <div className="space-y-4">
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Προσθήκη νέας καταγραφής..."
          className="w-full bg-gray-800 p-4 rounded resize-none h-32"
        ></textarea>
        <div className="flex gap-4">
          <button onClick={addEntry} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
            Αποθήκευση
          </button>
          <button onClick={clearHistory} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
            Καθαρισμός Όλων
          </button>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        {history.length === 0 ? (
          <p className="text-gray-500">Δεν υπάρχουν καταγραφές.</p>
        ) : (
          history.map((item, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded">
              <p className="text-sm text-gray-400">{item.date}</p>
              <p className="text-white">{item.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
