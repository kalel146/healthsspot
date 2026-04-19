import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";

const OWNER_ALLOWLIST = ["kalel146@hotmail.com"];

const steps = [
  {
    id: 1,
    eyebrow: "Welcome",
    title: "Καλώς ήρθες στο Health's Spot",
    body:
      "Σε 3 γρήγορα βήματα μπαίνεις στην εφαρμογή χωρίς onboarding-κουραφέξαλα. Πρώτα μπαίνεις, μετά βελτιώνουμε.",
  },
  {
    id: 2,
    eyebrow: "Your setup",
    title: "Το dashboard σου θα προσαρμοστεί πάνω σου",
    body:
      "Στόχοι, metrics και modules θα πατήσουν πάνω στα δεδομένα και τη χρήση σου. Άδειο προφίλ = άδειες υποσχέσεις.",
  },
  {
    id: 3,
    eyebrow: "Start clean",
    title: "Ξεκίνα clean χωρίς να κλειδώσεις κατά λάθος το account σου",
    body:
      "Αν έχεις ήδη tier ή owner/admin account, το onboarding δεν πρέπει να σε ρίχνει πίσω σε basic. Το app πρέπει να θυμάται ποιος είσαι, όχι να κάνει θέατρο.",
  },
];

function getResolvedUserLevel(user) {
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase?.() || "";
  const publicRole = String(user?.publicMetadata?.role || "").toLowerCase();
  const unsafeRole = String(user?.unsafeMetadata?.role || "").toLowerCase();
  const publicLevel = String(user?.publicMetadata?.userLevel || "").toLowerCase();
  const unsafeLevel = String(user?.unsafeMetadata?.userLevel || "").toLowerCase();
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const localOwnerPreview = typeof window !== "undefined" && window.localStorage?.getItem("hs-owner-preview") === "true";

  if (
    OWNER_ALLOWLIST.includes(email) ||
    publicRole === "admin" ||
    unsafeRole === "admin" ||
    publicLevel === "admin" ||
    unsafeLevel === "admin" ||
    query?.get("admin") === "true" ||
    localOwnerPreview
  ) {
    return "admin";
  }

  if (publicLevel) return publicLevel;
  if (unsafeLevel) return unsafeLevel;

  return "basic";
}

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDark = theme === "dark";
  const currentStep = useMemo(() => steps.find((item) => item.id === step) || steps[0], [step]);
  const resolvedLevel = useMemo(() => getResolvedUserLevel(user), [user]);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate("/sign-in", { replace: true });
    }
  }, [isLoaded, user, navigate]);

  const next = () => {
    setErrorMessage("");
    setStep((prev) => Math.min(steps.length, prev + 1));
  };

  const back = () => {
    setErrorMessage("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const completeOnboarding = async () => {
    if (loading) return;

    if (!user) {
      setErrorMessage("Ο χρήστης δεν είναι διαθέσιμος αυτή τη στιγμή. Κάνε refresh και ξαναδοκίμασε.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const nextUnsafeMetadata = {
      ...(user.unsafeMetadata || {}),
      isOnboarded: true,
      onboardingCompletedAt: new Date().toISOString(),
      userLevel: resolvedLevel,
    };

    if (resolvedLevel === "admin") {
      nextUnsafeMetadata.role = "admin";
    }

    try {
      await user.update({ unsafeMetadata: nextUnsafeMetadata });
      await user.reload();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Onboarding completion failed:", error);
      setErrorMessage("Αποτυχία ολοκλήρωσης onboarding. Ξαναδοκίμασε χωρίς πανικό.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"}`}>
        <p className="text-sm font-medium">Loading onboarding...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"}`}>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`w-full max-w-xl overflow-hidden rounded-[28px] border shadow-2xl ${isDark ? "border-white/10 bg-zinc-950" : "border-zinc-200 bg-white"}`}
      >
        <div className={`px-6 py-5 md:px-8 ${isDark ? "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_34%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_32%)]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">Onboarding</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">Καλώς ήρθες, {user.firstName || user.username || "Athlete"}</h1>
              <p className={`mt-2 text-sm ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>Μικρό onboarding, καθαρή είσοδος, τέλος τα περιττά εμπόδια.</p>
            </div>

            <div className={`rounded-2xl px-4 py-3 text-right ${isDark ? "bg-black/35 ring-1 ring-white/10" : "bg-white/70 ring-1 ring-zinc-200"}`}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Step</div>
              <div className="mt-1 text-lg font-bold text-yellow-400">{step}/{steps.length}</div>
            </div>
          </div>

          <div className={`mt-5 h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{currentStep.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black text-yellow-400">{currentStep.title}</h2>
              <p className={`mt-4 text-sm leading-7 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>{currentStep.body}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 text-sm ${item.id === step ? (isDark ? "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-400/20" : "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200") : isDark ? "bg-white/[0.035] text-zinc-400 ring-1 ring-white/6" : "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200"}`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em]">Step {item.id}</div>
                <div className="mt-2 font-bold">{item.eyebrow}</div>
              </div>
            ))}
          </div>

          <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${isDark ? "bg-white/[0.035] text-zinc-300 ring-1 ring-white/6" : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200"}`}>
            Current resolved access after onboarding: <strong className="text-yellow-400">{resolvedLevel}</strong>
          </div>

          {errorMessage && (
            <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {errorMessage}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button onClick={back} disabled={loading} className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-200 text-zinc-900 hover:bg-zinc-300"}`}>
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < steps.length ? (
              <button onClick={next} disabled={loading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                Next →
              </button>
            ) : (
              <button onClick={completeOnboarding} disabled={loading} className="rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Finishing..." : "Complete & Enter App →"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
