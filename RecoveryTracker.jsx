import React from "react";

export default function RecoveryTracker({ recoveryData = [] }) {
  if (!Array.isArray(recoveryData)) {
  return <p>Δεν υπάρχουν δεδομένα recovery.</p>;
}
    const averageRecovery =
    recoveryData.length > 0
      ? (
          recoveryData.reduce((acc, val) => acc + parseFloat(val.score || 0), 0) /
          recoveryData.length
        ).toFixed(1)
      : 0;
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">📊 Recovery Score</h3>
      <p className="text-lg">{averageRecovery}</p>
    </div>
  );

  return (
    <div className="bg-zinc-900/30 backdrop-blur-md shadow-md p-4 rounded-xl border border-neutral-700 mt-6">
      <h2 className="text-xl font-semibold text-sky-400 mb-2">💤 Ανάκαμψη Εβδομάδας</h2>
      {recoveryData.length === 0 ? (
        <p className="text-gray-400">Δεν υπάρχουν δεδομένα ακόμα.</p>
      ) : (
        <div className="text-white space-y-2">
          {recoveryData.map((entry, idx) => (
            <div
              key={idx}
              className={`p-2 rounded ${
                entry.score < 3
                  ? "bg-red-800/50"
                  : entry.score < 5
                  ? "bg-yellow-700/50"
                  : "bg-emerald-700/40"
              }`}
            >
              {entry.date}: Recovery Score {entry.score}
            </div>
          ))}
          <p className="mt-3 font-medium text-sky-300">
            🧠 Μέσος Όρος: {averageRecovery}/10
          </p>
        </div>
      )}
    </div>
  );
}
