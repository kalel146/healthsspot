import React from "react";
import { Flame, Activity } from "lucide-react";

export default function CardioCard({ data }) {
  return (
    <div className="p-4 rounded-lg border shadow bg-gray-50 dark:bg-gray-900">
      <div className="text-sm text-gray-400">{data.date}</div>
      <h4 className="text-lg font-semibold mb-2">{data.activity}</h4>
      <div className="flex items-center gap-2 text-blue-500">
        <Activity className="w-4 h-4" /> VO2max: <span className="font-bold">{data.VO2 ?? "-"}</span>
      </div>
      <div className="flex items-center gap-2 text-green-600">
        <Flame className="w-4 h-4" /> kcal: <span className="font-bold">{data.kcal ?? "-"}</span>
      </div>
    </div>
  );
}
