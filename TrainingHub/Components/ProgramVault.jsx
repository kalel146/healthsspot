// ProgramVault.jsx
import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { motion } from "framer-motion";
import { useTheme } from "../../ThemeContext";
import SubcategoryButtonLoader from "./SubcategoryButtonLoader";
import HoverPreviewEnhancer from "./HoverPreviewEnhancer";
import { useLocation, useNavigate } from "react-router-dom";

const useTierFilter = (defaultTier = "Free") => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const tier = query.get("tier") || defaultTier;
  const setTier = (newTier) => {
    query.set("tier", newTier);
    navigate({ search: query.toString() }, { replace: true });
  };
  return { tier, setTier };
};

const programFiles = [
  "gymPowerlifting.json",
  "indoorHomeBeginner.json",
  "outdoorTrackAndField.json",
  "athletismBasketball.json",
  "mobilityStretching.json"
];

const categoryMap = {
  Gym: ["gymPowerlifting.json", "Hypertrophy", "Power", "Performance", "Bodybuilding", "Fitness"],
  Indoor: ["indoorHomeBeginner.json", "Tabata", "EMOM", "Callisthenics", "Coordination", "Yoga", "Pilates", "HIIT"],
  Outdoor: ["outdoorTrackAndField.json", "Pool", "Playground", "OpenField", "Beach", "WoodWheelsAxeHammer", "Fight"],
  Athletism: ["athletismBasketball.json", "AmericanFootball", "Basketball", "Volleyball", "Baseball", "Handball", "Hockey", "Polo", "Soccer", "TrackAndField", "Swimming", "Gymnastics", "Striking", "Grappling", "Tennis", "Rowing", "Biking", "Skiing", "Hiking", "Climbing", "Surfing"],
  Mobility: ["mobilityStretching.json", "Stretching", "Stability", "Balance", "Flexibility", "Agility", "Coordination"]
};

const aiDescriptions = {
  Powerlifting: "Εστιασμένο σε βασικές άρσεις – squat, bench, deadlift. Ιδανικό για μέγιστη δύναμη.",
  Hypertrophy: "Σχεδιασμένο για αύξηση μυϊκής μάζας μέσω υψηλού όγκου και μέσης έντασης.",
  Yoga: "Ενισχύει ευλυγισία και πνευματική ευεξία. Ιδανικό για αποκατάσταση και ισορροπία.",
  Swimming: "Αναπτύσσει καρδιοαναπνευστική αντοχή και full-body συντονισμό.",
  Stretching: "Διατάσεις για βελτίωση εύρους κίνησης και πρόληψη τραυματισμών."
};

export default function ProgramVault() {
  const [programs, setPrograms] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { tier, setTier } = useTierFilter();
  const [selectedSub, setSelectedSub] = useState("");

  useEffect(() => {
    Promise.all(
      programFiles.map((file) =>
        fetch(`/ProgramData/${file}`).then((res) => res.json())
      )
    )
      .then((data) => {
        setPrograms(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading programs:", error);
        setLoading(false);
      });
  }, []);

  const categories = ["All", "Gym", "Indoor", "Outdoor", "Athletism", "Mobility"];

  const filteredPrograms =
    filteredCategory === "All"
      ? programs
      : programs.filter((_, index) =>
          categoryMap[filteredCategory]?.includes(programFiles[index])
        );

   const handleSubClick = (sub) => {
    setSelectedSub(sub);
  };

  return (
    <div
      className={`py-2 px-1 sm:px-2 min-h-screen transition-colors duration-300 text-[11px] sm:text-[12px] ${
        theme === "dark" ? "bg-zinc-950 text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-sm sm:text-base font-bold">🎯 Επιλογή Προγράμματος</h1>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="px-1 py-0.5 rounded border bg-white text-black text-[10px]"
        >
          {"Free Silver Gold Platinum".split(" ").map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap justify-center gap-1 mb-3">
        {categories.map((cat) => (
          <div key={cat} className="flex flex-col items-center">
            <button
              onClick={() => setFilteredCategory(cat)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition shadow-sm ${
                filteredCategory === cat
                  ? "bg-indigo-600 text-white"
                  : theme === "dark"
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
            {filteredCategory === cat && categoryMap[cat] && (
              <div className="mt-1 flex flex-wrap gap-1 justify-center max-w-4xl">
                {categoryMap[cat]
                  .filter((e) => !e.includes(".json"))
                  .map((sub, i) => (
                    <div key={i} className="relative group">
                      <motion.button
                        onClick={() => handleSubClick(sub)}
                        whileHover={{ scale: 1.02 }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition font-medium shadow-sm ${
                          theme === "dark"
                            ? "bg-zinc-800 text-indigo-300 hover:bg-zinc-700 border-zinc-700"
                            : "bg-zinc-100 text-indigo-700 hover:bg-zinc-200 border-zinc-300"
                        }`}
                      >
                  {sub}
                      </motion.button>
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 p-3 z-50 rounded-lg shadow-lg border transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none
                        backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 text-black dark:text-white border-zinc-300 dark:border-zinc-700"
                      >
                        <img src={`/StyledProgramImages/${sub}.jpg`}
                          alt={sub}
                          className="w-full h-24 object-cover rounded mb-1.5"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <p className="text-xs font-medium">{sub}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Περιγραφή σύντομα...</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedSub && (
        <div className="mb-4 p-2 rounded border shadow max-w-md mx-auto bg-white dark:bg-zinc-800">
          <h2 className="text-xs font-semibold mb-1">🔍 {selectedSub}</h2>
          <p className="text-[10px] text-zinc-600 dark:text-zinc-300">
            {aiDescriptions[selectedSub] || "Περιγραφή υπό κατασκευή για αυτή την υποενότητα..."}
          </p>
        </div>
      )}

      <div className="space-y-4 px-2">
        {categories.map((cat) => {
          const subs = categoryMap[cat]?.filter?.((e) => !e.includes(".json")) || [];
          return (
            <section key={cat}>
              <h2 className="text-xs font-semibold mb-1">{cat}</h2>
              <SubcategoryButtonLoader
                subcategories={subs.map((sub) => `${cat.toLowerCase()}${sub}`)}
              />
            </section>
          );
        })}
      </div>

      <HoverPreviewEnhancer
        subcategories={programFiles.map((file) => file.replace(".json", ""))}
      />

      {loading ? (
        <p className="text-center text-sm font-medium text-zinc-400 mt-6">Loading programs...</p>
      ) : (
        <div className="flex flex-col gap-4 items-center mt-6">
          {filteredPrograms.map((program, index) => (
            <ProgramCard key={index} program={program} userTier={tier} />
          ))}
        </div>
      )}
    </div>
  );
}
