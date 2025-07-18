import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { useTheme } from "../../ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* -------------------- helpers -------------------- */
const useTierFilter = (defaultTier = "Free") => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const tier = query.get("tier") || defaultTier;
  const isAdmin = query.get("admin") === "true";
  const setTier = (newTier) => {
    query.set("tier", newTier);
    navigate({ search: query.toString() }, { replace: true });
  };
  return { tier, setTier, isAdmin };
};

/* -------------------- main component -------------------- */
export default function ProgramVault() {
  const [programs, setPrograms] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("gym");
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { tier, isAdmin, setTier } = useTierFilter();

  useEffect(() => {
    const filenames = [
      "athletismBasketball.json",
      "gymHypertrophyBeginner1.json",
      "hypertrophyBeginner2.json",
      "hypertrophyBeginner3.json",
      "HypertrophyBeginner4.json",
      "HypertrophyIntermediate1.json",
      "HypertrophyIntermediate2.json",
      "hypertrophyadvanced1.json",
      "hypertrophyadvanced2.json",
      "hypertrophyadvanced3.json",
      "hypertrophyadvanced4.json",
      "gymFitnessBeginner1.json",
      "gymFitnessBeginner2.json",
      "gymFitnessBeginner3.json",
      "gymFitnessBeginner4.json",
      "gymFitnessBeginner5.json",
      "gymFitnessBeginner6.json",
      "gymFitnessBeginner7.json",
      "gymFitnessBeginner8.json",
      "gymFitnessBeginner9.json",
      "gymFitnessBeginner10.json",
      "gymPowerlifting.json",
      "gymPowerliftingbeginner1.json",
      "gymPowerliftingbeginner2.json",
      "gymPowerliftingbeginner3.json",
      "gymPowerliftingbeginner4.json",
      "gymPowerliftingIntermediate1.json",
      "gymPowerliftingIntermediate2.json",
      "gymPowerliftingIntermediate3.json",
      "gymPowerliftingAdvanced1.json",
      "gymPowerliftingAdvanced2.json",
      "gymPowerliftingAdvanced3.json",
      "homeBodyweightBeginner1.json",
      "homeBodyweightBeginner2.json",
      "homeBodyweightBeginner3.json",
      "homeBodyweightBeginner4.json",
      "homeBodyweightBeginner5.json",
      "homeBodyweightBeginner6.json",
      "homeBodyweightBeginner7.json",
      "homeBodyweightBeginner8.json",
      "homeBodyweightBeginner9.json",
      "homeBodyweightBeginner10.json",
      "indoorPilatesBeginner1.json",
      "indoorPilatesBeginner2.json",
      "indoorPilatesBeginner3.json",
      "indoorPilatesBeginner4.json",
      "indoorPilatesBeginner5.json",
      "indoorPilatesBeginner6.json",
      "indoorPilatesBeginner7.json",
      "indoorPilatesBeginner8.json",
      "indoorPilatesBeginner9.json",
      "indoorPilatesBeginner10.json",
      "indoorYogaBeginner1.json",
      "indoorYogaBeginner2.json",
      "indoorYogaBeginner3.json",
      "indoorYogaBeginner4.json",
      "indoorYogaBeginner5.json",
      "indoorYogaBeginner6.json",
      "indoorYogaBeginner7.json",
      "indoorYogaBeginner8.json",
      "indoorYogaBeginner9.json",
      "indoorYogaBeginner10.json",
      "indoorHomeBeginner.json",
      "mobilityStretching.json",
      "outdoorWoodWheelsAxeHammer1.json",
      "outdoorWoodWheelsAxeHammer2.json",
      "outdoorWoodWheelsAxeHammer3.json",
      "outdoorWoodWheelsAxeHammer4.json",
      "outdoorWoodWheelsAxeHammer5.json",
      "outdoorWoodWheelsAxeHammer6.json",
      "outdoorWoodWheelsAxeHammer7.json",
      "outdoorWoodWheelsAxeHammer8.json",
      "outdoorWoodWheelsAxeHammer9.json",
      "outdoorWoodWheelsAxeHammer10.json",
      "outdoorTrackAndField.json",
      "outdoorPoolBeginner1.json",
      "outdoorPoolBeginner2.json",
      "outdoorPoolBeginner3.json",
      "outdoorPoolBeginner4.json",
      "outdoorPoolBeginner5.json",
      "outdoorPoolBeginner6.json",
      "outdoorPoolBeginner7.json",
      "outdoorPoolBeginner8.json",
      "outdoorPoolBeginner9.json",
      "outdoorPoolBeginner10.json",
      "outdoorRunningBeginner1.json",
      "outdoorRunningBeginner2.json",
      "outdoorRunningBeginner3.json",
      "outdoorRunningBeginner4.json",
      "outdoorRunningBeginner5.json",
      "outdoorRunningBeginner6.json",
      "outdoorRunningBeginner7.json",
      "outdoorRunningBeginner8.json",
      "outdoorRunningBeginner9.json",
      "outdoorRunningBeginner10.json"
    ];

    Promise.all(
      filenames.map((f) =>
        fetch(`/ProgramData/${f}`)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const type = res.headers.get("content-type");
            if (!type.includes("application/json")) {
              throw new Error(`Invalid content-type: ${type}`);
            }
            return res.json();
          })
          .catch((e) => {
            console.error(`❌ Failed to load ${f}:`, e.message);
            return null;
          })
      )
    )
      .then((data) => {
        const validPrograms = data.filter((p) => p && p.category);
        setPrograms(validPrograms);
        if (validPrograms.length > 0) {
          setFilteredCategory("gym");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(programs.map((p) => p.category).filter(Boolean))].sort();
  const subcategories = [...new Set(programs.filter(p => p.category === filteredCategory).map(p => p.subcategory).filter(Boolean))].sort();
  const [filteredSubcategory, setFilteredSubcategory] = useState(null);

  const filteredPrograms = programs.filter(
    (p) =>
      p.category === filteredCategory &&
      (!filteredSubcategory || p.subcategory === filteredSubcategory) &&
      (isAdmin || p.accessTier === tier || p.accessTier === "Free")
  );

  return (
    <div className="p-4">
      {/* Tier Debugging Dropdown */}
      {isAdmin && (
        <div className="flex justify-center mb-4 gap-2 items-center">
          <label className="text-sm text-gray-500 dark:text-gray-300">Tier Preview:</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm shadow-sm bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="Free">Free</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>
      )}

      {/* Category Buttons */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border shadow-sm transition-all duration-300 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
              ${
                filteredCategory === cat
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent"
                  : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300"
              }`}
            onClick={() => {
              setFilteredCategory(cat);
              setFilteredSubcategory(null);
            }}
            title={`Φίλτρο για κατηγορία: ${cat}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Subcategory Buttons */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {subcategories.map((sub) => (
            <motion.button
              key={sub}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 overflow-hidden
                ${
                  filteredSubcategory === sub
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent"
                    : "bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300"
                }`}
              onClick={() => setFilteredSubcategory(sub)}
              title={`Φίλτρο για υποκατηγορία: ${sub}`}
            >
              <span className="relative z-10">{sub.charAt(0).toUpperCase() + sub.slice(1)}</span>
              {filteredSubcategory !== sub && (
                <span className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Program Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">No programs available for this category.</div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={filteredCategory + filteredSubcategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredPrograms.map((program, index) => (
              <ProgramCard
                key={index}
                program={program}
                userTier={tier}
                selectedCategory={filteredCategory}
                isAdmin={isAdmin}
                debugMode={isAdmin}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
