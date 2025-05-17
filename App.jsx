import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

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

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      {!isLanding && <Navbar />} {/* Εμφανίζει το Navbar μόνο αν ΔΕΝ είσαι στην αρχική */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
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

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
