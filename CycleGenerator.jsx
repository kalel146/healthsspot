import React from "react";

export default function CycleGenerator({ mode, weekType, recoveryStats, prStats }) {
  return (
    <div className="bg-gradient-to-br from-sky-900 to-zinc-800 p-5 rounded-xl border border-sky-600 mt-6 shadow-lg">
      <h2 className="text-xl font-semibold text-sky-300">🔄 Προγραμματισμός Κύκλου Προπόνησης</h2>
      <p className="mt-2 text-sky-200 font-medium">
        🔁 Τρέχων Τύπος Εβδομάδας: <span className="font-bold text-white">{weekType}</span>
      </p>

      <div className="mt-4 space-y-2">
        <p className="text-emerald-300">
          📈 PR της εβδομάδας: <span className="font-semibold text-white">{prStats?.latestPR || "--"} kg</span>
        </p>
        <p className="text-amber-300">
          🧠 Μέσο Recovery: <span className="font-semibold text-white">{recoveryStats?.avgRecovery || "--"}/5</span>
        </p>

        {mode === "PR" && (
          <p className="text-pink-400">🎯 Ενεργός κύκλος PR - Πίεσε προοδευτικά με ασφάλεια</p>
        )}
        {mode === "Deload" && (
          <p className="text-blue-400">💤 Deload Εβδομάδα - Μείωσε ένταση για αποκατάσταση</p>
        )}
        {mode === "Standard" && (
          <p className="text-gray-300">⚖️ Σταθερός Κύκλος - Συντήρησε σταθερό όγκο & ένταση</p>
        )}
      </div>
    </div>
  );
}
