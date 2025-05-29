import React, { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableCard from "./SortableCard";
import { fetchCardioLogs } from "./fetchCardioLogs";

export default function CardioDraggableHistory() {
  const [items, setItems] = useState([]);
  const [activityFilter, setActivityFilter] = useState("Όλα");

  useEffect(() => {
    async function loadLogs() {
      const data = await fetchCardioLogs(activityFilter); // 👈 εφαρμογή φίλτρου εδώ
      setItems(data);
    }
    loadLogs();
  }, [activityFilter]); // 👈 επανεκτέλεση όταν αλλάζει το φίλτρο

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Dropdown Φίλτρου */}
      <div className="flex justify-end mb-4">
        <select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
        >
          <option value="Όλα">Όλα</option>
          <option value="Τρέξιμο">Τρέξιμο</option>
          <option value="Περπάτημα">Περπάτημα</option>
          <option value="Κολύμβηση">Κολύμβηση</option>
          <option value="Ποδήλατο">Ποδήλατο</option>
        </select>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.map((entry) => (
              <SortableCard key={entry.id} id={entry.id} data={entry} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
