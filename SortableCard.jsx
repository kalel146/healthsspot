import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Flame, Activity } from "lucide-react";

export default function SortableCard({ id, data }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-4 border rounded-lg shadow bg-white dark:bg-gray-800"
    >
      <div>
        <div className="text-sm text-gray-400">{data.date}</div>
        <div className="text-lg font-semibold text-amber-600">{data.activity}</div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1 text-blue-500">
            <Activity className="w-4 h-4" /> {data.VO2} mL/kg/min
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Flame className="w-4 h-4" /> {data.kcal} kcal
          </div>
        </div>
      </div>
      <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />
    </div>
  );
}
