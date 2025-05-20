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
  };

  const handleReturnHome = () => {
    setShowQuote(false);
  };

  const handlePWAInstall = () => {
    alert("\ud83d\udcf2 \u0393\u03b9\u03b1 \u03b5\u03b3\u03ba\u03b1\u03c4\u03ac\u03c3\u03c4\u03b1\u03c3\u03b7 \u03c4\u03b7\u03c2 \u03b5\u03c6\u03b1\u03c1\u03bc\u03bf\u03b3\u03ae\u03c2, \u03c0\u03ac\u03c4\u03b1 \u03c4\u03bf \u22ee \u03c3\u03c4\u03bf browser \u03ba\u03b1\u03b9 \u03b4\u03b9\u03ac\u03bb\u03b5\u03be\u03b5 ' \u03a0\u03c1\u03bf\u03c3\u03b8\u03ae\u03ba\u03b7 \u03c3\u03c4\u03b7\u03bd \u03b1\u03c1\u03c7\u03b9\u03ba\u03ae \u03bf\u03b8\u03cc\u03bd\u03b7'.");
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
        <img
          src="/logo.jpg"
          alt="Health's Spot Logo"
          style={{ width: "800px" }}
          className="max-w-full cursor-pointer"
          onClick={handleReturnHome}
        />
      )}

      {!showQuote && (
        <>
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
        </>
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
        <div
          className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white"
          onClick={handleReturnHome}
        >
          <p className="text-3xl font-bold italic px-6 text-center">
            🍕"Rest day. The most powerful day. Enjoy life to the fullest."🍷
          </p>
          <button className="mt-8 text-sm text-yellow-400 underline">
            💪 Return to Home
          </button>
        </div>
      )}
    </motion.div>
  );
}
