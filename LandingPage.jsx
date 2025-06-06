import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";
const logo = "/logo.jpg";

const quotes = [
  "🍕\"Rest day. The most powerful day. Enjoy life to the fullest.\"🍷",
  "🥩\"Strength is earned, not given.\"🔥",
  "🏉\"Recovery is when the body speaks.\"🏉",
  "🎣\"Fall Down Seven Times, Stand Up Eight.\"🏇",
];

const handleExit = () => {
  try {
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        alert("❌ Δεν υποστηρίζεται το κλείσιμο σε αυτό το περιβάλλον. Κλείσε το tab χειροκύνητα 😓");
      }
    }, 300);
  } catch (err) {
    alert("❌ Δεν υποστηρίζεται το κλείσιμο σε αυτό το περιβάλλον. Κλείσε το tab χειροκύνητα 😓");
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);
  const [fadeOut, setFadeOut] = useState(false);
  const [shake, setShake] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (showQuote) {
      const random = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(random);
    }
  }, [showQuote]);

  const handleOnClick = () => {
    const sound = new Audio("/beast-on.mp3");
    setFadeOut(true);
    setShake(true);
    sound.play()
      .then(() => {
        setTimeout(() => {
          navigate("/dashboard");
        }, sound.duration * 1000 || 1800);
      })
      .catch((e) => {
        console.error("Audio play failed:", e);
        navigate("/dashboard");
      });
  };

  const handleOffClick = () => {
    const sound = new Audio("/beast-off.mp3");
    sound.play().catch((e) => console.error("Audio play failed:", e));
    setShowQuote(true);
  };

  const handleReturnHome = () => {
    setShowQuote(false);
    setFadeOut(false);
    setShake(false);
  };

  const handleInstall = () => {
    alert("📲 Για εγκατάσταση, πάτα ⋮ στον browser και διάλεξε 'Προσθήκη στην αρχική οθόνη'.");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: fadeOut ? 0 : 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 1.5 }}
        className={`relative flex flex-col items-center justify-center min-h-screen space-y-8 px-4 text-center bg-black text-white overflow-hidden ${shake ? "animate-shake" : ""}`}
      >
        {/* SVG-style animated flame background */}
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <radialGradient id="gradFlame" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#dc2626" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
            </radialGradient>
            <circle cx="50" cy="50" r="50" fill="url(#gradFlame)" className="animate-pulse" />
          </svg>
        </div>

        {!showQuote && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <motion.img
              src={logo}
              alt="Health's Spot Logo"
              style={{ width: "min(90vw, 800px)" }}
              className="max-w-full cursor-pointer hover:scale-105 transition-transform duration-300 drop-shadow-xl"
              onClick={handleReturnHome}
            />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-20"></div>
          </motion.div>
        )}

        {!showQuote && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="text-6xl font-extrabold text-transparent bg-clip-text drop-shadow-lg z-10 animate-shake-slight"
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
          <div className="z-10 flex flex-col items-center space-y-4">
            <div className="flex justify-center items-center w-full max-w-md space-x-6">
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
            <button
              onClick={handleInstall}
              className="text-base font-extrabold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent px-4 py-2 rounded-lg tracking-wide animate-flame shadow-md hover:scale-105 transition"
            >
              📲 Εγκατάσταση App
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white z-10"
          >
            <p className="text-3xl font-bold italic px-6 text-center z-10">{quote}</p>
            <div className="mt-8 flex flex-col space-y-3 z-10">
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
    </AnimatePresence>
  );
}
