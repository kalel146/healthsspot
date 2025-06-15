// HoverPreviewEnhancer.jsx
import React, { useState } from "react";
import ProgramCard from "./ProgramCard";
import { motion } from "framer-motion";

export default function HoverPreviewEnhancer({ subcategories }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {subcategories.map((slug) => (
          <motion.button
            key={slug}
            onClick={() => setSelected(slug)}
            onMouseEnter={() => setHovered(slug)}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.05 }}
            className="rounded-xl px-4 py-2 bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-500 transition text-sm"
          >
            {slug.replace(/([a-z])([A-Z])/g, "$1 $2")}
          </motion.button>
        ))}
      </div>

      {hovered && !selected && (
        <motion.div
          key={hovered}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 border border-dashed p-4 rounded-xl shadow bg-zinc-100 dark:bg-zinc-800"
        >
          <ProgramCard jsonPath={`/ProgramData/${hovered}.json`} />
        </motion.div>
      )}

      {selected && (
        <motion.div
          key={selected + "_selected"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <ProgramCard jsonPath={`/ProgramData/${selected}.json`} />
        </motion.div>
      )}
    </div>
  );
}
