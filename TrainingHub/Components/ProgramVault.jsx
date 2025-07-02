// ProgramVault.jsx
import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { motion } from "framer-motion";
import { useTheme } from "../../ThemeContext";
import SubcategoryButtonLoader from "./SubcategoryButtonLoader";
import HoverPreviewEnhancer from "./HoverPreviewEnhancer";
import { useLocation, useNavigate } from "react-router-dom";

/* -------------------- helpers -------------------- */
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


// Mock AI hook – fallback if API fails
const useAIPromptGenerator = () => {
  const [descriptions, setDescriptions] = useState({});
  const generateDescription = async (subcategory) => {
    if (descriptions[subcategory]) return;

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategory }),
      });

      if (!response.ok) throw new Error("API Failed");

      const result = await response.json();
      setDescriptions((prev) => ({ ...prev, [subcategory]: result }));
    } catch (error) {
      console.error("AI Error (fallback activated)", error);
      // Fallback with mock
      setDescriptions((prev) => ({
        ...prev,
        [subcategory]: {
          text: `💡 Το πρόγραμμα "${subcategory}" ενισχύει φυσική κατάσταση με έμφαση σε τεχνική, πρόοδο και συνέπεια.`,
          tier: "Silver",
        },
      }));
    }
  };
  return { descriptions, generateDescription };
};


/* -------------------- static data -------------------- */
const programFiles = [
  "gymPowerlifting.json",
  "indoorHomeBeginner.json",
  "outdoorTrackAndField.json",
  "athletismBasketball.json",
  "mobilityStretching.json",
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

/* -------------------- main component -------------------- */
export default function ProgramVault() {
  const [programs, setPrograms] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { tier, setTier } = useTierFilter();
  const [selectedSub, setSelectedSub] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { descriptions, generateDescription } = useAIPromptGenerator();

  /* ---------- fetch programs ---------- */
  useEffect(() => {
    Promise.all(programFiles.map((f) => fetch(`/ProgramData/${f}`).then((r) => r.json())))
      .then((data) => setPrograms(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ---------- derived ---------- */
  const categories = ["All", "Gym", "Indoor", "Outdoor", "Athletism", "Mobility"];
  const filteredPrograms = filteredCategory === "All" ? programs : programs.filter((_, i) => categoryMap[filteredCategory]?.includes(programFiles[i]));

  /* ---------- handlers ---------- */
  const handleSubClick = (sub) => {
    setSelectedSub(sub);
    generateDescription(sub);
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  /* ---------- render ---------- */
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

      {/* selected description card */}
      {selectedSub && (
        <div className="mb-3 p-2 rounded border shadow max-w-md mx-auto bg-white dark:bg-zinc-800">
          <h2 className="text-xs font-semibold mb-1">🔍 {selectedSub}</h2>
          <p className="text-[10px] text-zinc-600 dark:text-zinc-300 mb-1">{descriptions[selectedSub]?.text || "Φόρτωση περιγραφής..."}</p>
          {descriptions[selectedSub]?.tier && (
            <p className="text-[10px] italic text-zinc-500 dark:text-zinc-400">🎯 Προτεινόμενο Tier: {descriptions[selectedSub].tier}</p>
          )}
          <button onClick={openModal} className="mt-1 text-[10px] px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">💡 Προτεινόμενο πρόγραμμα</button>
        </div>
      )}

      {/* modal */}
      {showModal && selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded p-4 w-[90%] max-w-md shadow-xl relative">
            <button onClick={closeModal} className="absolute top-2 right-2 text-xl leading-none">×</button>
            <img src={`/StyledProgramImages/${selectedSub}.jpg`} alt={selectedSub} className="w-full h-32 object-cover rounded mb-2" onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.jpg"; }} />
            <h3 className="text-sm font-bold mb-1">{selectedSub}</h3>
            <p className="text-[10px] mb-2">{descriptions[selectedSub]?.text || "Φόρτωση περιγραφής..."}</p>
            {descriptions[selectedSub]?.tier && <p className="text-[10px] mb-2">🎖️ Συνιστώμενο Tier: <b>{descriptions[selectedSub].tier}</b></p>}
            {descriptions[selectedSub]?.tier && (
              tier === descriptions[selectedSub].tier ? <p className="text-[10px] text-green-600">Έχεις ήδη το κατάλληλο tier!</p> : <p className="text-[10px] text-red-600">Αναβάθμισε σε <b>{descriptions[selectedSub].tier}</b> για πλήρη πρόσβαση.</p>
            )}
          </div>
        </div>
      )}

      {/* program cards filtered */}
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
