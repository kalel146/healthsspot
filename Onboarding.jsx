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
    if (loading) return;

    setLoading(true);

    if (!user) {
      console.error("Onboarding failed: user object is undefined.");
      alert("User is not available. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata || {}),
          isOnboarded: true,
          userLevel: "basic",
        },
      });

      await user.reload();

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Onboarding completion failed:", error);
      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="mt-20 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 text-gray-800 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-md"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-yellow-600">
          🧭 Welcome, {user?.firstName || user?.username || "Athlete"}
        </h2>

        {step === 1 && (
          <p className="mb-6 text-center text-sm">
            Let's customize your experience. You'll be ready in just a few steps.
          </p>
        )}

        {step === 2 && (
          <p className="mb-6 text-center text-sm">
            📊 Set your goals and we'll personalize your dashboard.
          </p>
        )}

        {step === 3 && (
          <p className="mb-6 text-center text-sm">
            💬 Stay motivated. You'll get weekly tips & progress insights.
          </p>
        )}

        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <button
              onClick={back}
              disabled={loading}
              className="rounded bg-gray-300 px-4 py-2 text-sm text-black hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              onClick={next}
              disabled={loading}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="rounded bg-yellow-500 px-4 py-2 text-sm text-black hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Finishing..." : "Complete & Enter App →"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}