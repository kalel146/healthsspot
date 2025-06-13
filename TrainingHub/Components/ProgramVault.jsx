// ProgramVault.jsx
import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { motion } from "framer-motion";
import { useTheme } from "../../ThemeContext";
import SubcategoryButtonLoader from "./SubcategoryButtonLoader";


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

export default function ProgramVault({ userTier = "Free" }) {
  const [programs, setPrograms] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

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
    alert(`📌 Αυτό θα φορτώσει το πρόγραμμα: ${sub}`);
  };

  return (
    <div
      className={`py-12 px-4 sm:px-12 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-950 text-white" : "bg-white text-black"
      }`}
    >
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
                    <motion.button
                      key={i}
                      onClick={() => handleSubClick(sub)}
                      whileHover={{ scale: 1.05 }}
                      className={`text-sm sm:text-base px-4 py-2 rounded-xl border transition font-semibold shadow-sm ${
                        theme === "dark"
                          ? "bg-zinc-800 text-indigo-300 hover:bg-zinc-700 border-zinc-700"
                          : "bg-zinc-100 text-indigo-700 hover:bg-zinc-200 border-zinc-300"
                      }`}
                      title={`🧠 Πρόγραμμα: ${sub}`}
                    >
                      {sub}
                    </motion.button>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

        <div className="space-y-10 p-8">
      <h1 className="text-3xl font-bold mb-6">🎯 Επιλογή Προγράμματος</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">🏋️ Gym</h2>
        <SubcategoryButtonLoader
          subcategories={[
            "gymPowerlifting",
            "gymHypertrophy",
            "gymPerformance"
          ]}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">🏡 Indoor</h2>
        <SubcategoryButtonLoader
          subcategories={[
            "indoorHomeBeginner",
            "indoorTabata",
            "indoorHIIT"
          ]}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">🏞️ Outdoor</h2>
        <SubcategoryButtonLoader
          subcategories={[
            "outdoorTrackAndField",
            "outdoorFight"
          ]}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">🧘 Mobility</h2>
        <SubcategoryButtonLoader
          subcategories={[
            "mobilityStretching",
            "mobilityFlexibility"
          ]}
        />
      </section>
    </div>

      {loading ? (
        <p className="text-center text-lg font-medium text-zinc-400">Loading programs...</p>
      ) : (
        <div className="flex flex-col gap-8 items-center">
          {filteredPrograms.map((program, index) => (
            <ProgramCard key={index} program={program} userTier={userTier} />
          ))}
        </div>
      )}
    </div>
  );
}
