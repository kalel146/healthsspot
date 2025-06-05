import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";

const quotes = [
  "🍕\"Rest day. The most powerful day. Enjoy life to the fullest.\"🍷",
  "🥩\"Strength is earned, not given.\"🔥",
  "🛌\"Recovery is when the body speaks.\"🧘",
  "🥊\"Fall Down Seven Times, Stand Up Eight.\"🥇",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (showQuote) {
      const random = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(random);
    }
  }, [showQuote]);

  const handleOnClick = () => {
    navigate("/dashboard");
  };

  const handleOffClick = () => {
    setShowQuote(true);
  };

  const handleReturnHome = () => {
    setShowQuote(false);
  };

  const handleExit = () => {
  try {
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        alert("❌ Δεν υποστηρίζεται το κλείσιμο σε αυτό το περιβάλλον. Κλείσε το tab χειροκίνητα 🙃");
      }
    }, 300);
  } catch (err) {
    alert("❌ Δεν υποστηρίζεται το κλείσιμο σε αυτό το περιβάλλον. Κλείσε το tab χειροκίνητα 🙃");
  }
};

  const handlePWAInstall = () => {
    alert(
      "\ud83d\udcf2 Για εγκατάσταση της εφαρμογής, πάτα το ⋮ στο browser και διάλεξε 'Προσθήκη στην αρχική οθόνη'."
    );
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
      {!showQuote && (
        <motion.img
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          src="/logo.jpg"
          alt="Health's Spot Logo"
          style={{ width: "800px" }}
          className="max-w-full cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={handleReturnHome}
        />
      )}

      {!showQuote && (
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-extrabold text-transparent bg-clip-text drop-shadow-lg"
          style={{
            backgroundImage:
              "linear-gradient(to right, #facc15, #f97316, #dc2626, #7f1d1d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          BEAST MODE
        </motion.h1>
      )}

      {!showQuote ? (
        <>
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

          <div className="space-y-2 mt-4">
            <button
              onClick={toggleTheme}
              className="text-sm underline hover:text-yellow-400"
            >
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </button>

            <button
              onClick={handlePWAInstall}
              className="text-xs text-blue-400 hover:underline block"
            >
              🌎 Install App
            </button>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white"
        >
          <p className="text-3xl font-bold italic px-6 text-center">{quote}</p>
          <div className="mt-8 flex flex-col space-y-3">
            <button
              onClick={handleReturnHome}
              className="text-sm text-yellow-400 underline"
            >
              💪 Return to Home
            </button>
            <button
              onClick={handleExit}
              className="text-sm text-red-400 underline"
            >
              🚪 Exit App
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
