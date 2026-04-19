import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import { ThemeProvider } from "./ThemeContext";
import GlobalErrorBoundary from "./GlobalErrorBoundary";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_ZmFuY3kteWFrLTE1LmNsZXJrLmFjY291bnRzLmRldiQ";
const pwaEnabled = import.meta.env.VITE_ENABLE_PWA === "true";

async function cleanupLegacyPWAIfDisabled() {
  if (pwaEnabled || typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
    }
  } catch (error) {
    console.warn("Failed to unregister service workers:", error);
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)));
    }
  } catch (error) {
    console.warn("Failed to clear browser caches:", error);
  }
}

cleanupLegacyPWAIfDisabled().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <ThemeProvider>
          <GlobalErrorBoundary>
            <App />
          </GlobalErrorBoundary>
        </ThemeProvider>
      </ClerkProvider>
    </React.StrictMode>
  );
});
