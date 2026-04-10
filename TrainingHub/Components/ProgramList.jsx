// ProgramList.jsx
import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";
import { normalizeProgramTier } from "../../utils/accessControl";

const programFiles = [
  "gymPowerlifting.json",
  "indoorHomeBeginner.json",
  "outdoorTrackAndField.json",
  "athletismBasketball.json"
];

export default function ProgramList({ userTier = "Free" }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      programFiles.map(async (file) => {
        const res = await fetch(`/ProgramData/${file}`);
        if (!res.ok) throw new Error(`Failed to load ${file} (${res.status})`);
        return res.json();
      })
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

  if (loading) return <p className="text-center mt-8">Loading programs...</p>;

  return (
    <div className="flex flex-col gap-6 py-8">
      {programs.map((program, index) => (
        <ProgramCard key={program.filename || index} program={program} userTier={normalizeProgramTier(userTier)} />
      ))}
    </div>
  );
}
