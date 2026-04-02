// App.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";

// Lazy-loaded pages / modules
const LandingPage = lazy(() => import("./LandingPage"));
const Dashboard = lazy(() => import("./Dashboard"));
const Onboarding = lazy(() => import("./Onboarding"));
const PricingPage = lazy(() => import("./TrainingHub/Components/PricingPage"));
const ProgramVault = lazy(() => import("./TrainingHub/Components/ProgramVault"));
const StrengthModule = lazy(() => import("./StrengthModule"));
const CardioModule = lazy(() => import("./CardioModule"));
const NutritionModule = lazy(() => import("./NutritionModule"));
const RecoveryModule = lazy(() => import("./RecoveryModule"));
const ExportModule = lazy(() => import("./ExportModule"));
const CloudBackupIntegration = lazy(() => import("./CloudBackupIntegration"));
const HistorySystem = lazy(() => import("./HistorySystem"));
const CardioDraggableHistory = lazy(() => import("./CardioDraggableHistory"));
const ReportForm = lazy(() => import("./ReportForm"));
const AuthPage = lazy(() => import("./AuthPage"));

// Shell
import Layout from "./Layout";

function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-zinc-300">
      <div className="text-sm tracking-wide">Loading...</div>
    </div>
  );
}

function AppContent() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (
      isLoaded &&
      user &&
      user.unsafeMetadata?.isOnboarded !== true &&
      location.pathname !== "/onboarding"
    ) {
      navigate("/onboarding");
    }
  }, [isLoaded, user, location.pathname, navigate]);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public auth screens – χωρίς Layout / Navbar */}
        <Route path="/sign-in" element={<AuthPage />} />
        <Route path="/sign-up" element={<AuthPage />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Όλα τα υπόλοιπα περνάνε από το Layout */}
        <Route element={<Layout isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}>
          <Route index element={<LandingPage />} />

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

          <Route path="pricing" element={<PricingPage />} />
          <Route path="upgrade" element={<PricingPage />} />
          <Route path="programs" element={<ProgramVault userTier="Free" />} />
          <Route path="training" element={<StrengthModule />} />
          <Route path="power" element={<StrengthModule />} />
          <Route path="cardio" element={<CardioModule />} />
          <Route path="cardio-history" element={<CardioDraggableHistory />} />
          <Route path="nutrition" element={<NutritionModule />} />
          <Route path="recovery" element={<RecoveryModule />} />
          <Route path="export" element={<ExportModule />} />
          <Route path="cloud" element={<CloudBackupIntegration />} />
          <Route path="history" element={<HistorySystem />} />
          <Route path="report" element={<ReportForm />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}