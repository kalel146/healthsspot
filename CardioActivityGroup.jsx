import React from "react";
import CardioCard from "./CardioCard";

export default function CardioActivityGroup({ data }) {
  const grouped = data.reduce((acc, entry) => {
    const key = entry.activity || "Άγνωστο";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([activity, entries]) => (
        <div key={activity} className="border rounded-xl p-4 shadow bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-amber-600 mb-4">{activity}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry, idx) => (
              <CardioCard key={idx} data={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
