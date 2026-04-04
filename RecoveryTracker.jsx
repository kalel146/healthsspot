import React, { useMemo } from "react";

const toDisplayDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("el-GR");
};

export default function RecoveryTracker({ recoveryData = [] }) {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(recoveryData)) return [];

    return recoveryData
      .map((entry, index) => ({
        id: entry?.id ?? `${entry?.timestamp ?? entry?.date ?? "row"}-${index}`,
        date: toDisplayDate(entry?.timestamp || entry?.date),
        score: Number(entry?.recoveryScore ?? entry?.score ?? 0),
      }))
      .filter((entry) => entry.score > 0);
  }, [recoveryData]);

  const averageRecovery =
    normalizedData.length > 0
      ? (
          normalizedData.reduce((acc, val) => acc + val.score, 0) /
          normalizedData.length
        ).toFixed(1)
      : null;

  const latestRecovery =
    normalizedData.length > 0
      ? normalizedData[normalizedData.length - 1].score.toFixed(1)
      : null;

  if (!Array.isArray(recoveryData)) {
    return <p className="text-sm text-zinc-400">Δεν υπάρχουν δεδομένα recovery.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Μέσο Recovery
          </p>
          <p className="mt-2 text-2xl font-bold text-cyan-300">
            {averageRecovery ? `${averageRecovery}/5` : "--"}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Τελευταίο Recovery
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {latestRecovery ? `${latestRecovery}/5` : "--"}
          </p>
        </div>
      </div>

      {normalizedData.length === 0 ? (
        <p className="text-sm text-zinc-400">Δεν υπάρχουν δεδομένα ακόμα.</p>
      ) : (
        <div className="space-y-2">
          {normalizedData.slice(-7).reverse().map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl border p-3 text-sm ${
                entry.score < 2.5
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : entry.score < 4
                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              <span className="font-medium">{entry.date}</span> — Recovery Score{" "}
              <strong>{entry.score.toFixed(1)}</strong>/5
            </div>
          ))}
        </div>
      )}
    </div>
  );
}