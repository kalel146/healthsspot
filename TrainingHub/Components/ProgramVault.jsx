import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { useTheme } from "../../ThemeContext";
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

/* -------------------- main component -------------------- */
export default function ProgramVault() {
  const [programs, setPrograms] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { tier } = useTierFilter();

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
      "gymPowerlifting.json",
      "indoorHomeBeginner.json",
      "mobilityStretching.json",
      "outdoorTrackAndField.json"
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
          setFilteredCategory(validPrograms[0].category);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(programs.map((p) => p.category).filter(Boolean))];
  const filteredPrograms = programs.filter((p) => p.category === filteredCategory);

  return (
    <div className="p-4">
      <div className="mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`mr-2 px-3 py-1 rounded text-sm font-medium border transition-colors duration-200 ${
              filteredCategory === cat
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
            }`}
            onClick={() => setFilteredCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading programs...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrograms.map((program, index) => (
            <ProgramCard
              key={index}
              program={program}
              userTier={tier}
              selectedCategory={filteredCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
