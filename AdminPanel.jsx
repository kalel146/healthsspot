import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
import AdminIntakeLogs from "./AdminIntakeLogs";

const ADMIN_EMAIL_ALLOWLIST = ["giannis@admin.dev"];

function PanelCard({ theme, title, subtitle, children }) {
  return (
    <section
      className={`rounded-3xl border p-5 shadow-xl transition-colors ${
        theme === "dark"
          ? "border-white/8 bg-zinc-950/80 text-white"
          : "border-slate-200 bg-white/90 text-slate-900"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-yellow-400">{title}</h2>
          {subtitle ? (
            <p className={`mt-1 text-sm ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function StatChip({ theme, label, value }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        theme === "dark"
          ? "border-white/8 bg-white/[0.03]"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-yellow-400">{value}</div>
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();

  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase?.() || "";
  const role = String(user?.publicMetadata?.role || "").toLowerCase();
  const userLevel = String(user?.publicMetadata?.userLevel || "").toLowerCase();

  const isAdmin =
    role === "admin" ||
    userLevel === "admin" ||
    ADMIN_EMAIL_ALLOWLIST.includes(primaryEmail);

  const adminSummary = useMemo(
    () => [
      { label: "Role", value: isAdmin ? "Admin" : "Restricted" },
      { label: "Access", value: isAdmin ? "Granted" : "Denied" },
      { label: "Email", value: primaryEmail || "Unknown" },
    ],
    [isAdmin, primaryEmail]
  );

  if (!isLoaded) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center px-4 ${
          theme === "dark" ? "bg-black text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 px-6 py-4 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Admin
          </div>
          <p className="mt-2 text-sm">Γίνεται έλεγχος δικαιωμάτων πρόσβασης…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Helmet>
          <title>Access Denied | Health&apos;s Spot Admin</title>
          <meta
            name="description"
            content="Restricted admin access page for Health's Spot."
          />
        </Helmet>

        <div
          className={`flex min-h-screen items-center justify-center px-4 ${
            theme === "dark"
              ? "bg-gradient-to-br from-black via-zinc-950 to-slate-950 text-white"
              : "bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900"
          }`}
        >
          <div
            className={`w-full max-w-lg rounded-[32px] border p-8 text-center shadow-2xl ${
              theme === "dark"
                ? "border-red-500/25 bg-zinc-950/85"
                : "border-red-200 bg-white/90"
            }`}
          >
            <div className="text-4xl">🔐</div>
            <h1 className="mt-4 text-2xl font-black text-red-500">Access Denied</h1>
            <p className={`mt-3 text-sm leading-7 ${theme === "dark" ? "text-zinc-300" : "text-slate-600"}`}>
              Το Admin Panel δεν είναι για βόλτα. Αν δεν έχεις admin δικαιώματα, εδώ απλώς θα τρως πόρτα.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
              >
                Πίσω στο Dashboard
              </button>
              <button
                onClick={() => navigate("/pricing")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  theme === "dark"
                    ? "bg-zinc-900 text-white ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
                    : "bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-yellow-500/20"
                }`}
              >
                Δες τα plans
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel | Health&apos;s Spot</title>
        <meta
          name="description"
          content="Health's Spot admin panel for internal monitoring and logs."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`min-h-screen px-4 py-8 md:px-6 xl:px-8 ${
          theme === "dark"
            ? "bg-gradient-to-br from-black via-zinc-950 to-slate-950 text-white"
            : "bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div
            className={`rounded-[32px] border p-6 shadow-2xl ${
              theme === "dark"
                ? "border-white/8 bg-zinc-950/80"
                : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-400">
                  Internal Console
                </div>
                <h1 className="mt-3 text-3xl font-black text-yellow-400 md:text-4xl">
                  🔐 Admin Panel
                </h1>
                <p className={`mt-3 max-w-3xl text-sm leading-7 ${theme === "dark" ? "text-zinc-300" : "text-slate-600"}`}>
                  Αυτό είναι panel ελέγχου, όχι βιτρίνα. Κράτα καθαρά logs, καθαρό access model και μηδενική αυταπάτη ότι τα mock blocks είναι production backend.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {adminSummary.map((item) => (
                  <StatChip key={item.label} theme={theme} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <PanelCard
              theme={theme}
              title="📋 Signed-up Users"
              subtitle="Placeholder admin area until you wire real backend/admin APIs."
            >
              <div
                className={`rounded-2xl border p-4 ${
                  theme === "dark"
                    ? "border-white/8 bg-white/[0.03]"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className={`text-sm leading-7 ${theme === "dark" ? "text-zinc-300" : "text-slate-600"}`}>
                  Αυτή τη στιγμή το section είναι UI shell. Για πραγματικό production admin panel θα χρειαστείς:
                </p>

                <ul className={`mt-3 space-y-2 text-sm ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
                  <li>• fetch πραγματικών users από Clerk / backend</li>
                  <li>• search / filter / tier state</li>
                  <li>• subscription status / onboarding status</li>
                  <li>• safe admin actions με role checks server-side</li>
                </ul>

                <div className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs leading-6 text-yellow-300">
                  Μη βασιστείς ποτέ μόνο σε client-side admin check για πραγματικά ευαίσθητες ενέργειες. Εκεί σε πετσοκόβουν.
                </div>
              </div>
            </PanelCard>

            <PanelCard
              theme={theme}
              title="📊 Usage Logs"
              subtitle="Live intake / usage visibility from your existing admin logs component."
            >
              <div
                className={`overflow-auto rounded-2xl border p-4 ${
                  theme === "dark"
                    ? "border-white/8 bg-white/[0.03]"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <AdminIntakeLogs />
              </div>
            </PanelCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <PanelCard
              theme={theme}
              title="🚨 Error Reports"
              subtitle="Temporary shell until you wire Sentry / log drain / Supabase error tables."
            >
              <div
                className={`rounded-2xl border p-4 ${
                  theme === "dark"
                    ? "border-white/8 bg-white/[0.03]"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className={`text-sm leading-7 ${theme === "dark" ? "text-zinc-300" : "text-slate-600"}`}>
                  [Mock State] Δεν υπάρχουν καταγεγραμμένα critical errors σε αυτό το panel. Αυτό δεν σημαίνει ότι δεν υπάρχουν errors· συχνά σημαίνει ότι δεν τα μαζεύεις ακόμα σωστά.
                </p>
              </div>
            </PanelCard>

            <PanelCard
              theme={theme}
              title="🧭 Admin Actions"
              subtitle="Fast return points so you don't wander like a lost tourist in your own app."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate("/pricing")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    theme === "dark"
                      ? "bg-zinc-900 text-white ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
                      : "bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-yellow-500/20"
                  }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    theme === "dark"
                      ? "bg-zinc-900 text-white ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
                      : "bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-yellow-500/20"
                  }`}
                >
                  History
                </button>
              </div>
            </PanelCard>
          </div>
        </div>
      </motion.div>
    </>
  );
}
