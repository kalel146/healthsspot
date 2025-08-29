// Διορθωμένος κώδικας ProgramVault.jsx με fixes για Phase 1, content-type guard και ταξινόμηση phases

import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { useTheme } from "../../ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ProgramVault() {
  const [programs, setPrograms] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("gym");
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { tier, isAdmin, setTier } = useTierFilter();

  useEffect(() => {
    const proFiles = Array.from({ length: 10 }, (_, i) => `athletismBasketballPro${i + 1}.json`);

    const filenames = [
      ...proFiles,
      "athletismNFLAmericanFootballElite1.json",
      "athletismNFLAmericanFootballElite2.json",
      "athletismNFLAmericanFootballElite3.json",
      "athletismNFLAmericanFootballElite4.json",
      "athletismNFLAmericanFootballElite5.json",
      "athletismNFLAmericanFootballElite6.json",
      "athletismNFLAmericanFootballElite7.json",
      "athletismNFLAmericanFootballElite8.json",
      "athletismNFLAmericanFootballElite9.json",
      "athletismNFLAmericanFootballElite10.json",
      "athletismSoccerElite1.json",
      "athletismSoccerElite2.json",
      "athletismSoccerElite3.json",
      "athletismSoccerElite4.json",
      "athletismSoccerElite5.json",
      "athletismSoccerElite6.json",
      "athletismSoccerElite7.json",
      "athletismSoccerElite8.json",
      "athletismSoccerElite9.json",
      "athletismSoccerElite10.json",
      "gymHypertrophyBeginner1.json",
      "athletismVolleyballElite1.json",
      "athletismVolleyballElite2.json",
      "athletismVolleyballElite3.json",
      "athletismVolleyballElite4.json",
      "athletismVolleyballElite5.json",
      "athletismVolleyballElite6.json",
      "athletismVolleyballElite7.json",
      "athletismVolleyballElite8.json",
      "athletismVolleyballElite9.json",
      "athletismVolleyballElite10.json",
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
      "gymPowerIntermediate1.json",
      "gymPowerIntermediate2.json",
      "gymPowerIntermediate3.json",
      "gymPowerIntermediate4.json",
      "gymPowerAdvanced1.json",
      "gymPowerAdvanced2.json",
      "gymPowerAdvanced3.json",
      "gymPowerPro1.json",
      "gymPowerPro2.json",
      "gymPowerPro3.json",
      "gymBodybuildingBeginner1.json",
      "gymBodybuildingBeginner2.json",
      "gymBodybuildingIntermediate1.json",
      "gymBodybuildingIntermediate2.json",
      "gymBodybuildingAdvanced1.json",
      "gymBodybuildingAdvanced2.json",
      "gymBodybuildingAdvanced3.json",
      "gymBodybuildingAdvanced4.json",
      "gymBodybuildingPro1.json",
      "gymBodybuildingPro2.json",
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
      "mobilityCoordinationPhase1.json",
      "mobilityCoordinationPhase2.json",
      "mobilityCoordinationPhase3.json",
      "mobilityCoordinationPhase4.json",
      "mobilityCoordinationPhase5.json",
      "mobilityCoordinationPhase6.json",
      "mobilityCoordinationPhase7.json",
      "mobilityCoordinationPhase8.json",
      "mobilityCoordinationPhase9.json",
      "mobilityCoordinationPhase10.json",
      "mobilityStretchingBeginner1.json",
      "mobilityStretchingBeginner2.json",
      "mobilityStretchingBeginner3.json",
      "mobilityStretchingIntermediate1.json",
      "mobilityStretchingIntermediate2.json",
      "mobilityStretchingIntermediate3.json",
      "mobilityStretchingAdvanced1.json",
      "mobilityStretchingAdvanced2.json",
      "mobilityStretchingPro1.json",
      "mobilityStretchingPro2.json",
      "mobilityKinesiologyBeginner1.json",
      "mobilityKinesiologyBeginner2.json",
      "mobilityKinesiologyBeginner3.json",
      "mobilityKinesiologyIntermediate1.json",
      "mobilityKinesiologyIntermediate2.json",
      "mobilityKinesiologyIntermediate3.json",
      "mobilityKinesiologyAdvanced1.json",
      "mobilityKinesiologyAdvanced2.json",
      "mobilityKinesiologyPro1.json",
      "mobilityInjuryManagementBeginner1.json",
      "mobilityInjuryManagementBeginner2.json",
      "mobilityInjuryManagementBeginner3.json",
      "mobilityInjuryManagementIntermediate1.json",
      "mobilityInjuryManagementIntermediate2.json",
      "mobilityInjuryManagementIntermediate3.json",
      "mobilityInjuryManagementAdvanced1.json",
      "mobilityInjuryManagementAdvanced2.json",
      "mobilityInjuryManagementPro1.json",
      "mobilityInjuryManagementPro2.json",
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
      "outdoorPlaygroundBeginner1.json",
      "outdoorPlaygroundBeginner2.json",
      "outdoorPlaygroundBeginner3.json",
      "outdoorPlaygroundIntermediate1.json",
      "outdoorPlaygroundIntermediate2.json",
      "outdoorPlaygroundIntermediate3.json",
      "outdoorPlaygroundAdvanced1.json",
      "outdoorPlaygroundAdvanced2.json",
      "outdoorPlaygroundAdvanced3.json",
      "outdoorPlaygroundPro1.json",
      "outdoorPlaygroundPro2.json",
      "outdoorBeachBeginner1.json",
      "outdoorBeachBeginner2.json",
      "outdoorBeachBeginner3.json",
      "outdoorBeachIntermediate1.json",
      "outdoorBeachIntermediate2.json",
      "outdoorBeachIntermediate3.json",
      "outdoorBeachAdvanced1.json",
      "outdoorBeachAdvanced2.json",
      "outdoorBeachAdvanced3.json",
      "outdoorBeachPro1.json",
      "outdoorBeachPro2.json",
      "outdoorFightBeginner1.json",
      "outdoorFightBeginner2.json",
      "outdoorFightBeginner3.json",
      "outdoorFightIntermediate1.json",
      "outdoorFightIntermediate2.json",
      "outdoorFightIntermediate3.json",
      "outdoorFightAdvanced1.json",
      "outdoorFightAdvanced2.json",
      "outdoorFightAdvanced3.json",
      "outdoorFightPro1.json",
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
            const type = res.headers.get("content-type") || "";
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
        // Dedupe by filename or fallback key
        const deduped = Array.from(
          new Map(
            validPrograms.map((p) => [p.filename || `${p.category}-${p.title}`, p])
          ).values()
        );
        setPrograms(deduped);
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

  const sortedPrograms = filteredPrograms
    .slice()
    .sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0) || (a.title || "").localeCompare(b.title || ""));

  return (
    <div className="p-4">
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
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </motion.button>
        ))}
      </div>

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
            >
              <span className="relative z-10">{sub.charAt(0).toUpperCase() + sub.slice(1)}</span>
              {filteredSubcategory !== sub && (
                <span className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
              )}
            </motion.button>
          ))}
        </div>
      )}

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
            {sortedPrograms.map((program, index) => (
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
