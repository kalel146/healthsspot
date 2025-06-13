// ProgramList.jsx
import React, { useEffect, useState } from "react";
import ProgramCard from "./ProgramCard";

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

  if (loading) return <p className="text-center mt-8">Loading programs...</p>;

  return (
    <div className="flex flex-col gap-6 py-8">
      {programs.map((program, index) => (
        <ProgramCard key={index} program={program} userTier={userTier} />
      ))}
    </div>
  );
}
