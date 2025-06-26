// App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";

// Pages / modules
import LandingPage               from "./LandingPage";
import Dashboard                 from "./Dashboard";
import Onboarding                from "./Onboarding";
import PricingPage               from "./TrainingHub/Components/PricingPage";
import ProgramVault             from "./TrainingHub/Components/ProgramVault";
import StrengthModule            from "./StrengthModule";
import CardioModule              from "./CardioModule";
import NutritionModule           from "./NutritionModule";
import RecoveryModule            from "./RecoveryModule";
import ExportModule              from "./ExportModule";
import CloudBackupIntegration    from "./CloudBackupIntegration";
import HistorySystem             from "./HistorySystem";
import CardioDraggableHistory    from "./CardioDraggableHistory";
import ReportForm                from "./ReportForm";
import AuthPage                  from "./AuthPage";

// Shell
import Layout from "./Layout";

function AppContent() {
  // Clerk
  const { user, isLoaded } = useUser();

  // Router helpers
  const navigate   = useNavigate();
  const location   = useLocation();

  // Sidebar state (auto-expand ≥ lg)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Onboarding guard
  useEffect(() => {
    if (
      isLoaded &&
      user &&
      user.unsafeMetadata?.isOnboarded !== true &&
      location.pathname !== "/onboarding"
    ) {
      navigate("/onboarding");
    }
  }, [isLoaded, user, location.pathname]);

  // --- ROUTES ------------------------------------------------------------
  return (
    <Routes>
      {/* Public auth screens – χωρίς Layout / Navbar */}
      <Route path="/sign-in"  element={<AuthPage />} />
      <Route path="/sign-up"  element={<AuthPage />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Όλα τα υπόλοιπα περνάνε από το Layout */}
      <Route element={<Layout isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}>
        {/* "/" => LandingPage (χωρίς sidebar σε mobile, thanks to Layout) */}
        <Route index element={<LandingPage />} />

        {/* Dashboard προστατεύεται από Clerk */}
        <Route
          path="dashboard"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Υπόλοιπα modules */}
        <Route path="pricing"          element={<PricingPage />} />
        <Route path="programs"         element={<ProgramVault userTier="Free" />} />
        <Route path="training"         element={<StrengthModule />} />
        <Route path="cardio"           element={<CardioModule />} />
        <Route path="cardio-history"   element={<CardioDraggableHistory />} />
        <Route path="nutrition"        element={<NutritionModule />} />
        <Route path="recovery"         element={<RecoveryModule />} />
        <Route path="export"           element={<ExportModule />} />
        <Route path="cloud"            element={<CloudBackupIntegration />} />
        <Route path="history"          element={<HistorySystem />} />
        <Route path="report"           element={<ReportForm />} />
      </Route>
    </Routes>
  );
}

// --- APP ROOT ------------------------------------------------------------
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
