// Onboarding.jsx
import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => Math.max(1, prev - 1));

  const completeOnboarding = async () => {
    setLoading(true);
    if (!user) {
      console.error("Onboarding failed: user object is undefined.");
      alert("User is not available. Please try again later.");
      setLoading(false);
      return;
    }
    try {
      console.log("Updating user...");

      await user.update({
        unsafeMetadata: {
          isOnboarded: true,
          userLevel: "basic",
        },
      });

      console.log("User update successful. Reloading...");

      // 🔁 Reload to refresh user metadata
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error type:", error?.constructor?.name);
      console.error("Error keys:", Object.keys(error || {}));
      console.error("Error as string:", String(error));

      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-yellow-600">
          🧭 Welcome, {user?.firstName || user?.username || "Athlete"}
        </h2>

        {step === 1 && <p className="text-sm text-center mb-6">Let's customize your experience. You'll be ready in just a few steps.</p>}
        {step === 2 && <p className="text-sm text-center mb-6">📊 Set your goals and we'll personalize your dashboard.</p>}
        {step === 3 && <p className="text-sm text-center mb-6">💬 Stay motivated. You'll get weekly tips & progress insights.</p>}

        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={back}
              className="px-4 py-2 text-sm bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              ← Back
            </button>
          ) : <span />}

          {step < 3 ? (
            <button
              onClick={next}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="px-4 py-2 text-sm bg-yellow-500 text-black rounded hover:bg-yellow-600"
            >
              {loading ? "Finishing..." : "Complete & Enter App →"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
