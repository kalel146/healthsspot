import React from "react";

async function clearServiceWorkersAndCaches() {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
    }
  } catch (error) {
    console.warn("Service worker cleanup failed:", error);
  }

  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)));
    }
  } catch (error) {
    console.warn("Cache cleanup failed:", error);
  }
}

function shouldAttemptSelfHeal(error) {
  const text = String(error?.message || error || "");
  return /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|getResolvedUserLevel|getResolvedAccess|ReferenceError/i.test(text);
}

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      recoveryStarted: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    this.trySelfHeal(error);
  }

  async trySelfHeal(error) {
    if (!shouldAttemptSelfHeal(error)) return;
    if (this.state.recoveryStarted) return;

    const key = "hs-self-heal-attempted";
    if (sessionStorage.getItem(key) === "1") return;

    sessionStorage.setItem(key, "1");
    this.setState({ recoveryStarted: true });

    await clearServiceWorkersAndCaches();

    const url = new URL(window.location.href);
    url.searchParams.set("hs_recovered", String(Date.now()));
    window.location.replace(url.toString());
  }

  handleTryAgain = async () => {
    sessionStorage.removeItem("hs-self-heal-attempted");
    await clearServiceWorkersAndCaches();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const message = String(this.state.error?.message || this.state.error || "Unknown application error");

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <div className="text-4xl">⚠️</div>
          <h1 className="mt-4 text-2xl font-black text-red-400">Κάτι έσπασε, αλλά δεν θα σε αφήσουμε σε μαύρη οθόνη.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Η εφαρμογή βρήκε σφάλμα και μπλόκαρε το crash loop. Αυτό συνήθως σημαίνει παλιό cached build ή broken chunk μετά από deploy.
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-400 break-words">
            {message}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={this.handleTryAgain}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
            >
              Καθαρισμός cache & επανεκκίνηση
            </button>
            <button
              onClick={() => window.location.replace("/")}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5"
            >
              Πίσω στην αρχική
            </button>
          </div>
        </div>
      </div>
    );
  }
}
