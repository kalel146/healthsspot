import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";

const logo = "/logo.jpg";

const quotes = [
  "Recovery is not weakness. Είναι μέρος της απόδοσης.",
  "Consistency beats drama. Κάθε φορά.",
  "Train hard, recover harder, think clearly.",
  "The goal is not hype. The goal is usable performance.",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);
  const [fadeOut, setFadeOut] = useState(false);
  const [shake, setShake] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const ambientRef = useRef(null);
  const onSoundRef = useRef(null);
  const offSoundRef = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const ambient = ambientRef.current;
    if (!ambient) return;

    ambient.loop = true;
    ambient.preload = "auto";
    ambient.muted = isMuted;
    ambient.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    if (showQuote) {
      const random = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(random);
    }
  }, [showQuote]);

  const syncAudioSettings = (audio) => {
    if (!audio) return;
    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : volume;
  };

  const tryPlay = async (audio, { restart = false } = {}) => {
    if (!audio) return;
    syncAudioSettings(audio);

    try {
      if (restart) audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn("Audio playback failed:", error);
    }
  };

  const handleOnClick = async () => {
    setFadeOut(true);
    setShake(true);

    const onSound = onSoundRef.current;
    const ambient = ambientRef.current;

    if (ambient) {
      ambient.pause();
      ambient.currentTime = 0;
    }

    await tryPlay(onSound, { restart: true });

    const durationMs =
      Number.isFinite(onSound?.duration) && onSound.duration > 0
        ? Math.round(onSound.duration * 1000)
        : 1400;

    setTimeout(() => {
      navigate("/dashboard");
    }, durationMs);
  };

  const handleOffClick = async () => {
    const offSound = offSoundRef.current;
    const ambient = ambientRef.current;

    if (ambient) ambient.pause();
    await tryPlay(offSound, { restart: true });

    setFadeOut(false);
    setShake(false);
    setShowQuote(true);
  };

  const handleReturnHome = async () => {
    setShowQuote(false);
    setFadeOut(false);
    setShake(false);
    await tryPlay(ambientRef.current, { restart: true });
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    alert("Για εγκατάσταση, άνοιξε το μενού του browser και διάλεξε 'Προσθήκη στην αρχική οθόνη'.");
  };

  const rootBg =
    theme === "dark"
      ? "bg-black text-white"
      : "bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900";

  return (
    <>
      <Helmet>
        <title>Health&apos;s Spot | Performance, tracking and coaching</title>
        <meta
          name="description"
          content="Health's Spot combines training, nutrition, recovery, export and structured performance tracking in one clean platform."
        />
      </Helmet>

      <AnimatePresence mode="wait">
        <motion.div
          key={showQuote ? "quote" : "home"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: fadeOut ? 0 : 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8 }}
          className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center ${rootBg} ${
            shake ? "animate-shake" : ""
          }`}
        >
          <div className="absolute inset-0 z-0">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <radialGradient id="gradFlame" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#dc2626" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="50" fill="url(#gradFlame)" className="animate-pulse" />
            </svg>
          </div>

          <audio ref={ambientRef} src="/ambient-loop.mp3" preload="auto" className="hidden" />
          <audio ref={onSoundRef} src="/beast-on.mp3" preload="auto" className="hidden" />
          <audio ref={offSoundRef} src="/beast-off.mp3" preload="auto" className="hidden" />

          {!showQuote ? (
            <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-6">
              <div className="absolute right-0 top-0 hidden gap-2 md:flex">
                <button
                  onClick={() => navigate("/pricing")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    theme === "dark"
                      ? "bg-zinc-900/80 text-white ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
                      : "bg-white/90 text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-yellow-500/20"
                  }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => navigate("/sign-in")}
                  className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
                >
                  Sign in
                </button>
              </div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <motion.img
                  src={logo}
                  alt="Health's Spot Logo"
                  style={{ width: "min(88vw, 720px)" }}
                  className="max-w-full cursor-pointer drop-shadow-xl transition-transform duration-300 hover:scale-[1.02]"
                  onClick={handleReturnHome}
                />
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 opacity-20 animate-ping" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="z-10 bg-clip-text text-5xl font-extrabold text-transparent drop-shadow-lg md:text-7xl"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #facc15, #f97316, #dc2626, #7f1d1d)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                BEAST MODE
              </motion.h1>

              <p
                className={`z-10 max-w-3xl text-sm leading-7 md:text-base ${
                  theme === "dark" ? "text-zinc-300" : "text-slate-600"
                }`}
              >
                Training, nutrition, recovery και performance tracking σε μία ενιαία πλατφόρμα, σχεδιασμένη για καθαρή παρακολούθηση, οργάνωση και ουσιαστική πρόοδο.
              </p>

              <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
                <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-zinc-950/70 ring-1 ring-white/8" : "bg-white/85 ring-1 ring-slate-200"}`}>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">Track</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-300 md:text-[15px]">Κατέγραψε προπόνηση, cardio, recovery και ιστορικό με σαφήνεια και συνέπεια.</div>
                </div>
                <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-zinc-950/70 ring-1 ring-white/8" : "bg-white/85 ring-1 ring-slate-200"}`}>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">Plan</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-300 md:text-[15px]">Δομημένα προγράμματα, διατροφική οργάνωση και καθαρή πρόσβαση ανά επίπεδο χρήστη.</div>
                </div>
                <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-zinc-950/70 ring-1 ring-white/8" : "bg-white/85 ring-1 ring-slate-200"}`}>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">Export</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-300 md:text-[15px]">Μετέτρεψε τα δεδομένα σου σε καθαρές, έτοιμες αναφορές για αποθήκευση, παρουσίαση ή αποστολή.</div>
                </div>
              </div>

              <div className="z-10 flex flex-col items-center gap-4">
                <div className="flex w-full max-w-md items-center justify-center gap-4">
                  <button
                    onClick={handleOnClick}
                    className="rounded-2xl bg-green-600 px-10 py-3 text-xl font-bold text-white transition hover:bg-green-700"
                  >
                    ON
                  </button>
                  <button
                    onClick={handleOffClick}
                    className="rounded-2xl bg-red-600 px-10 py-3 text-xl font-bold text-white transition hover:bg-red-700"
                  >
                    OFF
                  </button>
                </div>

                <div
                  className={`flex flex-col items-center gap-3 rounded-2xl px-4 py-3 md:flex-row ${
                    theme === "dark"
                      ? "bg-zinc-950/70 ring-1 ring-inset ring-white/8"
                      : "bg-white/85 ring-1 ring-inset ring-slate-200"
                  }`}
                >
                  <label
                    className={`text-sm ${
                      theme === "dark" ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    🔊 Volume:
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="ml-2 w-32 align-middle"
                    />
                  </label>

                  <button
                    onClick={() => setIsMuted((prev) => !prev)}
                    className={`text-sm font-semibold underline ${
                      theme === "dark" ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {isMuted ? "🔇 Ήχος Off" : "🔊 Ήχος On"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => navigate("/sign-up")}
                    className="rounded-2xl bg-yellow-500 px-6 py-3 text-base font-extrabold tracking-wide text-black shadow-lg transition hover:scale-[1.02] hover:bg-yellow-400"
                  >
                    ✨ Start Free
                  </button>
                  <button
                    onClick={() => navigate("/pricing")}
                    className={`rounded-2xl px-6 py-3 text-base font-bold ${
                      theme === "dark"
                        ? "bg-zinc-900/80 text-white ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
                        : "bg-white/90 text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-yellow-500/20"
                    }`}
                  >
                    💳 View Plans
                  </button>
                  <button
                    onClick={handleInstall}
                    className="rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 px-6 py-3 text-base font-extrabold tracking-wide text-black shadow-lg transition hover:scale-[1.02]"
                  >
                    📲 Install App
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="z-10 flex h-screen w-screen flex-col items-center justify-center px-6 text-center"
            >
              <p className="max-w-3xl text-2xl font-bold italic md:text-3xl">{quote}</p>
              <div className="mt-8 flex flex-col gap-3">
                <button onClick={handleReturnHome} className="text-sm text-yellow-400 underline">
                  Return to Home
                </button>
                <button onClick={() => navigate("/pricing")} className="text-sm text-white underline">
                  See Plans
                </button>
                <button onClick={() => navigate("/sign-up")} className="text-sm text-emerald-300 underline">
                  Start Free
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
