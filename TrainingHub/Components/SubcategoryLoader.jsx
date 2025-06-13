// SubcategoryLoader.jsx
import React, { useState } from "react";
import ProgramCard from "./ProgramCard";

export default function SubcategoryLoader({ slug }) {
  const [selectedJson, setSelectedJson] = useState(null);

  const handleClick = () => {
    const path = `/ProgramData/${slug}.json`;
    setSelectedJson(path);
  };

  return (
    <div className="mb-8 text-center">
      <button
        onClick={handleClick}
        className="px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold shadow"
      >
        Φόρτωσε πρόγραμμα: {slug.replace(/([a-z])([A-Z])/g, "$1 $2")}
      </button>

      {selectedJson && (
        <div className="mt-6">
          <ProgramCard jsonPath={selectedJson} />
        </div>
      )}
    </div>
  );
}
