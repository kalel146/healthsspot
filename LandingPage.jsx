import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showQuote, setShowQuote] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleOnClick = () => {
    navigate("/dashboard");
  };

  const handleOffClick = () => {
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 3500);
  };

  const handlePWAInstall = () => {
    alert("📲 Για εγκατάσταση της εφαρμογής, πάτα το ⋮ στο browser και διάλεξε 'Προσθήκη στην αρχική οθόνη'.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col items-center justify-center min-h-screen space-y-8 px-4 text-center ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <img
        src="/logo.jpg"
        alt="Health's Spot Logo"
        style={{ width: "800px" }}
        className="max-w-full"
      />

      <h1
        className="text-6xl font-extrabold text-transparent bg-clip-text drop-shadow-lg"
        style={{
          backgroundImage:
            "linear-gradient(to right, #facc15, #f97316, #dc2626, #7f1d1d)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        BEAST MODE
      </h1>

      <button
        onClick={toggleTheme}
        className="mb-2 text-sm underline hover:text-yellow-400"
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      <button
        onClick={handlePWAInstall}
        className="text-xs text-blue-400 hover:underline"
      >
        📲 Install App
      </button>

      {!showQuote ? (
        <div className="flex space-x-10">
          <button
            onClick={handleOnClick}
            className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-3 px-10 rounded"
          >
            ON
          </button>
          <button
            onClick={handleOffClick}
            className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-3 px-10 rounded"
          >
            OFF
          </button>
        </div>
      ) : (
        <p className="text-xl text-gray-300 italic max-w-xl">
          "Rest day. The most powerful day. Enjoy life to the fullest."
        </p>
      )}
    </motion.div>
  );
}
