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
      className={`py-12 px-4 sm:px-12 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-950 text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎯 Επιλογή Προγράμματος</h1>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="px-4 py-2 rounded-md border bg-white text-black"
        >
          {['Free', 'Silver', 'Gold', 'Platinum'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-14">
        {categories.map((cat) => (
          <div key={cat} className="flex flex-col items-center">
            <button
              onClick={() => setFilteredCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-base font-semibold tracking-wide transition shadow ${
                filteredCategory === cat
                  ? "bg-indigo-600 text-white shadow-lg"
                  : theme === "dark"
                  ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
            {filteredCategory === cat && categoryMap[cat] && (
              <div className="mt-4 flex flex-wrap gap-3 justify-center max-w-6xl">
                {categoryMap[cat]
                  .filter((e) => !e.includes(".json"))
                  .map((sub, i) => (
                    <div key={i} className="relative group">
                      <motion.button
                        onClick={() => handleSubClick(sub)}
                        whileHover={{ scale: 1.05 }}
                        className={`text-sm sm:text-base px-4 py-2 rounded-xl border transition font-semibold shadow-sm ${
                          theme === "dark"
                            ? "bg-zinc-800 text-indigo-300 hover:bg-zinc-700 border-zinc-700"
                            : "bg-zinc-100 text-indigo-700 hover:bg-zinc-200 border-zinc-300"
                        }`}
                      >
                        {sub}
                      </motion.button>
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 z-50 rounded-xl shadow-lg border transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none
                        backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 text-black dark:text-white border-zinc-300 dark:border-zinc-700"
                      >
                        <img src={`/StyledProgramImages/${sub}.jpg`}
                          alt={sub}
                          className="w-full h-32 object-cover rounded-md mb-2"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <p className="text-sm font-medium">Πρόγραμμα: {sub}</p>
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
        <div className="mb-10 p-4 rounded-lg border shadow-md max-w-xl mx-auto bg-white dark:bg-zinc-800">
          <h2 className="text-xl font-semibold mb-1">🔍 {selectedSub}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {aiDescriptions[selectedSub] || "Περιγραφή υπό κατασκευή για αυτή την υποενότητα..."}
          </p>
        </div>
      )}

      <div className="space-y-10 p-8">
        {categories.map((cat) => {
          const subs = categoryMap[cat]?.filter?.((e) => !e.includes(".json")) || [];
         
          return (
    <section key={cat}>
      <h2 className="text-xl font-semibold mb-2">{cat}</h2>
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
        <p className="text-center text-lg font-medium text-zinc-400">Loading programs...</p>
      ) : (
        <div className="flex flex-col gap-8 items-center">
          {filteredPrograms.map((program, index) => (
            <ProgramCard key={index} program={program} userTier={tier} />
          ))}
        </div>
      )}
    </div>
  );
}
