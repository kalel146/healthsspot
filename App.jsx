// App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import StrengthModule from "./StrengthModule";
import CardioModule from "./CardioModule";
import NutritionModule from "./NutritionModule";
import RecoveryModule from "./RecoveryModule";
import ExportModule from "./ExportModule";
import CloudBackupIntegration from "./CloudBackupIntegration";
import HistorySystem from "./HistorySystem";
import Navbar from "./Navbar";
import AuthPage from "./AuthPage";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      {!isLanding && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<AuthPage />} />
        <Route path="/sign-up" element={<AuthPage />} />

        <Route
          path="/dashboard"
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
        <Route path="/training" element={<StrengthModule />} />
        <Route path="/cardio" element={<CardioModule />} />
        <Route path="/nutrition" element={<NutritionModule />} />
        <Route path="/recovery" element={<RecoveryModule />} />
        <Route path="/export" element={<ExportModule />} />
        <Route path="/cloud" element={<CloudBackupIntegration />} />
        <Route path="/history" element={<HistorySystem />} />
      </Routes>
    </>
  );
}

export default AppContent;
