// SubcategoryButtonLoader.jsx
import React, { useState } from "react";
import ProgramCard from "./ProgramCard";

export default function SubcategoryButtonLoader({ subcategories = [] }) {
  const [selectedSlug, setSelectedSlug] = useState(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {subcategories.map((slug) => (
        <button
          key={slug}
          onClick={() => setSelectedSlug(slug)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-md transition"
        >
          {slug.replace(/([a-z])([A-Z])/g, "$1 $2")}
        </button>
      ))}

      {selectedSlug && (
        <div className="col-span-full mt-6">
          <ProgramCard jsonPath={`/ProgramData/${selectedSlug}.json`} />
        </div>
      )}
    </div>
  );
}
