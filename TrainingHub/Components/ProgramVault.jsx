// ProgramVault.jsx — drop-in patched version
// Fixes:
// 1) Tier hierarchy (Gold sees Bronze/Silver/etc.)
// 2) URL sync for category/subcategory (persist across refresh, shareable)
// 3) Robust dedupe using source filename; keep _src
// 4) Safer sort: level → phase → title
// 5) "All" subcategory + toggle to clear filter
// 6) Optional index.json discovery (if present) else fallback to static list
// 7) Minor UI polish & guards

import React, { useEffect, useMemo, useState } from "react";
import ProgramCard from "./ProgramCard";
import { useTheme } from "../../ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// -------------------------
// Tier helpers
// -------------------------
const tierRank = (t) => ({ Free: 0, Bronze: 1, Silver: 2, Gold: 3, Platinum: 4 }[t] ?? 0);
const hasAccess = (userTier, programTier) => tierRank(userTier) >= tierRank(programTier || "Free");

// -------------------------
// URL query helpers
// -------------------------
const useQuery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const set = (key, value) => {
    const q = new URLSearchParams(location.search);
    if (value === null || value === undefined || value === "") q.delete(key);
    else q.set(key, value);
    navigate({ search: q.toString() }, { replace: true });
  };
  return { query, set };
};

const useTierFilter = (defaultTier = "Free") => {
  const { query, set } = useQuery();
  const tier = query.get("tier") || defaultTier;
  const isAdmin = query.get("admin") === "true";
  const setTier = (newTier) => set("tier", newTier);
  return { tier, isAdmin, setTier };
};

const useCatSubFilters = (fallbackCat = "gym") => {
  const { query, set } = useQuery();
  const category = query.get("cat") || fallbackCat;
  const subcategory = query.get("sub") || "";
  const setCategory = (c) => set("cat", c);
  const setSubcategory = (s) => set("sub", s || "");
  return { category, subcategory, setCategory, setSubcategory };
};

export default function ProgramVault() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme(); // eslint-disable-line no-unused-vars
  const { tier, isAdmin, setTier } = useTierFilter();
  const { category, subcategory, setCategory, setSubcategory } = useCatSubFilters("gym");

  // --------------
  // Static fallback list (paste your existing list — kept 1:1)
  // --------------
  const STATIC_FILES = useMemo(() => {
    const proFiles = Array.from({ length: 10 }, (_, i) => `athletismBasketballPro${i + 1}.json`);
    return [
      ...proFiles,
      "athletismNFLAmericanFootballElite1.json",
      "athletismNFLAmericanFootballElite2.json",
      "athletismNFLAmericanFootballElite3.json",
      "athletismNFLAmericanFootballElite4.json",
      "athletismNFLAmericanFootballElite5.json",
      "athletismNFLAmericanFootballElite6.json",
      "athletismNFLAmericanFootballElite7.json",
      "athletismNFLAmericanFootballElite8.json",
      "athletismNFLAmericanFootballElite9.json",
      "athletismNFLAmericanFootballElite10.json",
      "athletismBaseballElite_P1.json",
    "athletismBaseballElite_P2.json",
    "athletismBaseballElite_P3.json",
    "athletismBaseballElite_P4.json",
    "athletismBaseballElite_P5.json",
    "athletismBaseballElite_P6.json",
    "athletismBaseballElite_P7.json",
    "athletismBaseballElite_P8.json",
    "athletismBaseballElite_P9.json",
    "athletismBaseballElite_P10.json",
      "athletismHockeyElite_P1.json",
    "athletismHockeyElite_P2.json",
    "athletismHockeyElite_P3.json",
    "athletismHockeyElite_P4.json",
    "athletismHockeyElite_P5.json",
    "athletismHockeyElite_P6.json",
    "athletismHockeyElite_P7.json",
    "athletismHockeyElite_P8.json",
    "athletismHockeyElite_P9.json",
    "athletismHockeyElite_P10.json",
      "athletismSoccerElite1.json",
      "athletismSoccerElite2.json",
      "athletismSoccerElite3.json",
      "athletismSoccerElite4.json",
      "athletismSoccerElite5.json",
      "athletismSoccerElite6.json",
      "athletismSoccerElite7.json",
      "athletismSoccerElite8.json",
      "athletismSoccerElite9.json",
      "athletismSoccerElite10.json",
      "gymHypertrophyBeginner1.json",
      "athletismVolleyballElite1.json",
      "athletismVolleyballElite2.json",
      "athletismVolleyballElite3.json",
      "athletismVolleyballElite4.json",
      "athletismVolleyballElite5.json",
      "athletismVolleyballElite6.json",
      "athletismVolleyballElite7.json",
      "athletismVolleyballElite8.json",
      "athletismVolleyballElite9.json",
      "athletismVolleyballElite10.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P1.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P2.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P3.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P4.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P5.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P6.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P7.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P8.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P9.json",
      "athletismTrackAndFieldElite_SprintsHurdles_P10.json",
      "athletismTrackAndFieldElite_MDLD_P1.json",
      "athletismTrackAndFieldElite_MDLD_P2.json",
      "athletismTrackAndFieldElite_MDLD_P3.json",
      "athletismTrackAndFieldElite_MDLD_P4.json",
      "athletismTrackAndFieldElite_MDLD_P5.json",
      "athletismTrackAndFieldElite_MDLD_P6.json",
      "athletismTrackAndFieldElite_MDLD_P7.json",
      "athletismTrackAndFieldElite_MDLD_P8.json",
      "athletismTrackAndFieldElite_MDLD_P9.json",
      "athletismTrackAndFieldElite_MDLD_P10.json",
      "athletismTrackAndFieldElite_Jumps_P1.json",
      "athletismTrackAndFieldElite_Jumps_P2.json",
      "athletismTrackAndFieldElite_Jumps_P3.json",
      "athletismTrackAndFieldElite_Jumps_P4.json",
      "athletismTrackAndFieldElite_Jumps_P5.json",
      "athletismTrackAndFieldElite_Jumps_P6.json",
      "athletismTrackAndFieldElite_Jumps_P7.json",
      "athletismTrackAndFieldElite_Jumps_P8.json",
      "athletismTrackAndFieldElite_Jumps_P9.json",
      "athletismTrackAndFieldElite_Jumps_P10.json",
      "athletismTrackAndFieldElite_Throws_P1.json",
      "athletismTrackAndFieldElite_Throws_P2.json",
      "athletismTrackAndFieldElite_Throws_P3.json",
      "athletismTrackAndFieldElite_Throws_P4.json",
      "athletismTrackAndFieldElite_Throws_P5.json",
      "athletismTrackAndFieldElite_Throws_P6.json",
      "athletismTrackAndFieldElite_Throws_P7.json",
      "athletismTrackAndFieldElite_Throws_P8.json",
      "athletismTrackAndFieldElite_Throws_P9.json",
      "athletismTrackAndFieldElite_Throws_P10.json",
      "athletismTrackAndFieldElite_Combined_P1.json",
      "athletismTrackAndFieldElite_Combined_P2.json",
      "athletismTrackAndFieldElite_Combined_P3.json",
      "athletismTrackAndFieldElite_Combined_P4.json",
      "athletismTrackAndFieldElite_Combined_P5.json",
      "athletismTrackAndFieldElite_Combined_P6.json",
      "athletismTrackAndFieldElite_Combined_P7.json",
      "athletismTrackAndFieldElite_Combined_P8.json",
      "athletismTrackAndFieldElite_Combined_P9.json",
      "athletismTrackAndFieldElite_Combined_P10.json",
      "athletismGymnasticsElite_P1.json",
      "athletismGymnasticsElite_P2.json",
      "athletismGymnasticsElite_P3.json",
      "athletismGymnasticsElite_P4.json",
      "athletismGymnasticsElite_P5.json",
      "athletismGymnasticsElite_P6.json",
      "athletismGymnasticsElite_P7.json",
      "athletismGymnasticsElite_P8.json",
      "athletismGymnasticsElite_P9.json",
      "athletismGymnasticsElite_P10.json",
      "athletismSwimmingElite_P1.json",
      "athletismSwimmingElite_P2.json",
      "athletismSwimmingElite_P3.json",
      "athletismSwimmingElite_P4.json",
      "athletismSwimmingElite_P5.json",
      "athletismSwimmingElite_P6.json",
      "athletismSwimmingElite_P7.json",
      "athletismSwimmingElite_P8.json",
      "athletismSwimmingElite_P9.json",
      "athletismSwimmingElite_P10.json",
      "athletismPoloElite_P1.json",
    "athletismPoloElite_P2.json",
    "athletismPoloElite_P3.json",
    "athletismPoloElite_P4.json",
    "athletismPoloElite_P5.json",
    "athletismPoloElite_P6.json",
    "athletismPoloElite_P7.json",
    "athletismPoloElite_P8.json",
    "athletismPoloElite_P9.json",
    "athletismPoloElite_P10.json",
      "athletismHandballElite_P1.json",
      "athletismHandballElite_P2.json",
      "athletismHandballElite_P3.json",
      "athletismHandballElite_P4.json",
      "athletismHandballElite_P5.json",
      "athletismHandballElite_P6.json",
      "athletismHandballElite_P7.json",
      "athletismHandballElite_P8.json",
      "athletismHandballElite_P9.json",
      "athletismHandballElite_P10.json",
      "athletismRowingElite_P1.json",
      "athletismRowingElite_P2.json",
      "athletismRowingElite_P3.json",
      "athletismRowingElite_P4.json",
      "athletismRowingElite_P5.json",
      "athletismRowingElite_P6.json",
      "athletismRowingElite_P7.json",
      "athletismRowingElite_P8.json",
      "athletismRowingElite_P9.json",
      "athletismRowingElite_P10.json",
      "athletismTennisElite_P1.json",
    "athletismTennisElite_P2.json",
    "athletismTennisElite_P3.json",
    "athletismTennisElite_P4.json",
    "athletismTennisElite_P5.json",
    "athletismTennisElite_P6.json",
    "athletismTennisElite_P7.json",
    "athletismTennisElite_P8.json",
    "athletismTennisElite_P9.json",
    "athletismTennisElite_P10.json",
    "athletismBikingElite_P1.json",
    "athletismBikingElite_P2.json",
    "athletismBikingElite_P3.json",
    "athletismBikingElite_P4.json",
    "athletismBikingElite_P5.json",
    "athletismBikingElite_P6.json",
    "athletismBikingElite_P7.json",
    "athletismBikingElite_P8.json",
    "athletismBikingElite_P9.json",
    "athletismBikingElite_P10.json",
      "athletismSkiingElite_P1.json",
    "athletismSkiingElite_P2.json",
    "athletismSkiingElite_P3.json",
    "athletismSkiingElite_P4.json",
    "athletismSkiingElite_P5.json",
    "athletismSkiingElite_P6.json",
    "athletismSkiingElite_P7.json",
    "athletismSkiingElite_P8.json",
    "athletismSkiingElite_P9.json",
    "athletismSkiingElite_P10.json",
    "athletismStrikingElite_P1.json",
    "athletismStrikingElite_P2.json",
    "athletismStrikingElite_P3.json",
    "athletismStrikingElite_P4.json",
    "athletismStrikingElite_P5.json",
    "athletismStrikingElite_P6.json",
    "athletismStrikingElite_P7.json",
    "athletismStrikingElite_P8.json",
    "athletismStrikingElite_P9.json",
    "athletismStrikingElite_P10.json",
    "athletismGrapplingElite_P1.json",
    "athletismGrapplingElite_P2.json",
    "athletismGrapplingElite_P3.json",
    "athletismGrapplingElite_P4.json",
    "athletismGrapplingElite_P5.json",
    "athletismGrapplingElite_P6.json",
    "athletismGrapplingElite_P7.json",
    "athletismGrapplingElite_P8.json",
    "athletismGrapplingElite_P9.json",
    "athletismGrapplingElite_P10.json",
     "athletismClimbingElite_P1.json",
    "athletismClimbingElite_P2.json",
    "athletismClimbingElite_P3.json",
    "athletismClimbingElite_P4.json",
    "athletismClimbingElite_P5.json",
    "athletismClimbingElite_P6.json",
    "athletismClimbingElite_P7.json",
    "athletismClimbingElite_P8.json",
    "athletismClimbingElite_P9.json",
    "athletismClimbingElite_P10.json",
    "athletismHikingElite_P1.json",
    "athletismHikingElite_P2.json",
    "athletismHikingElite_P3.json",
    "athletismHikingElite_P4.json",
    "athletismHikingElite_P5.json",
    "athletismHikingElite_P6.json",
    "athletismHikingElite_P7.json",
    "athletismHikingElite_P8.json",
    "athletismHikingElite_P9.json",
    "athletismHikingElite_P10.json",
    "athletismSurfingElite_P1.json",
    "athletismSurfingElite_P2.json",
    "athletismSurfingElite_P3.json",
    "athletismSurfingElite_P4.json",
    "athletismSurfingElite_P5.json",
    "athletismSurfingElite_P6.json",
    "athletismSurfingElite_P7.json",
    "athletismSurfingElite_P8.json",
    "athletismSurfingElite_P9.json",
    "athletismSurfingElite_P10.json",
      "hypertrophyBeginner1.json",
      "hypertrophyBeginner2.json",
      "hypertrophyBeginner3.json",
      "HypertrophyBeginner4.json",
      "HypertrophyIntermediate1.json",
      "HypertrophyIntermediate2.json",
      "hypertrophyadvanced1.json",
      "hypertrophyadvanced2.json",
      "hypertrophyadvanced3.json",
      "hypertrophyadvanced4.json",
      "gymFitnessBeginner1.json",
      "gymFitnessBeginner2.json",
      "gymFitnessBeginner3.json",
      "gymFitnessBeginner4.json",
      "gymFitnessBeginner5.json",
      "gymFitnessBeginner6.json",
      "gymFitnessBeginner7.json",
      "gymFitnessBeginner8.json",
      "gymFitnessBeginner9.json",
      "gymFitnessBeginner10.json",
      "gymPowerlifting.json",
      "gymPowerliftingbeginner1.json",
      "gymPowerliftingbeginner2.json",
      "gymPowerliftingbeginner3.json",
      "gymPowerliftingbeginner4.json",
      "gymPowerliftingIntermediate1.json",
      "gymPowerliftingIntermediate2.json",
      "gymPowerliftingIntermediate3.json",
      "gymPowerliftingAdvanced1.json",
      "gymPowerliftingAdvanced2.json",
      "gymPowerliftingAdvanced3.json",
      "gymPowerIntermediate1.json",
      "gymPowerIntermediate2.json",
      "gymPowerIntermediate3.json",
      "gymPowerIntermediate4.json",
      "gymPowerAdvanced1.json",
      "gymPowerAdvanced2.json",
      "gymPowerAdvanced3.json",
      "gymPowerPro1.json",
      "gymPowerPro2.json",
      "gymPowerPro3.json",
      "gymBodybuildingBeginner1.json",
      "gymBodybuildingBeginner2.json",
      "gymBodybuildingIntermediate1.json",
      "gymBodybuildingIntermediate2.json",
      "gymBodybuildingAdvanced1.json",
      "gymBodybuildingAdvanced2.json",
      "gymBodybuildingAdvanced3.json",
      "gymBodybuildingAdvanced4.json",
      "gymBodybuildingPro1.json",
      "gymBodybuildingPro2.json",
      "homeBodyweightBeginner1.json",
      "homeBodyweightBeginner2.json",
      "homeBodyweightBeginner3.json",
      "homeBodyweightBeginner4.json",
      "homeBodyweightBeginner5.json",
      "homeBodyweightBeginner6.json",
      "homeBodyweightBeginner7.json",
      "homeBodyweightBeginner8.json",
      "homeBodyweightBeginner9.json",
      "homeBodyweightBeginner10.json",
      "indoorPilatesBeginner1.json",
      "indoorPilatesBeginner2.json",
      "indoorPilatesBeginner3.json",
      "indoorPilatesBeginner4.json",
      "indoorPilatesBeginner5.json",
      "indoorPilatesBeginner6.json",
      "indoorPilatesBeginner7.json",
      "indoorPilatesBeginner8.json",
      "indoorPilatesBeginner9.json",
      "indoorPilatesBeginner10.json",
      "indoorYogaBeginner1.json",
      "indoorYogaBeginner2.json",
      "indoorYogaBeginner3.json",
      "indoorYogaBeginner4.json",
      "indoorYogaBeginner5.json",
      "indoorYogaBeginner6.json",
      "indoorYogaBeginner7.json",
      "indoorYogaBeginner8.json",
      "indoorYogaBeginner9.json",
      "indoorYogaBeginner10.json",
      "indoorHomeBeginner.json",
      "mobilityStretching.json",
      "mobilityCoordinationPhase1.json",
      "mobilityCoordinationPhase2.json",
      "mobilityCoordinationPhase3.json",
      "mobilityCoordinationPhase4.json",
      "mobilityCoordinationPhase5.json",
      "mobilityCoordinationPhase6.json",
      "mobilityCoordinationPhase7.json",
      "mobilityCoordinationPhase8.json",
      "mobilityCoordinationPhase9.json",
      "mobilityCoordinationPhase10.json",
      "mobilityStretchingBeginner1.json",
      "mobilityStretchingBeginner2.json",
      "mobilityStretchingBeginner3.json",
      "mobilityStretchingIntermediate1.json",
      "mobilityStretchingIntermediate2.json",
      "mobilityStretchingIntermediate3.json",
      "mobilityStretchingAdvanced1.json",
      "mobilityStretchingAdvanced2.json",
      "mobilityStretchingPro1.json",
      "mobilityStretchingPro2.json",
      "mobilityKinesiologyBeginner1.json",
      "mobilityKinesiologyBeginner2.json",
      "mobilityKinesiologyBeginner3.json",
      "mobilityKinesiologyIntermediate1.json",
      "mobilityKinesiologyIntermediate2.json",
      "mobilityKinesiologyIntermediate3.json",
      "mobilityKinesiologyAdvanced1.json",
      "mobilityKinesiologyAdvanced2.json",
      "mobilityKinesiologyPro1.json",
      "mobilityInjuryManagementBeginner1.json",
      "mobilityInjuryManagementBeginner2.json",
      "mobilityInjuryManagementBeginner3.json",
      "mobilityInjuryManagementIntermediate1.json",
      "mobilityInjuryManagementIntermediate2.json",
      "mobilityInjuryManagementIntermediate3.json",
      "mobilityInjuryManagementAdvanced1.json",
      "mobilityInjuryManagementAdvanced2.json",
      "mobilityInjuryManagementPro1.json",
      "mobilityInjuryManagementPro2.json",
      "outdoorWoodWheelsAxeHammer1.json",
      "outdoorWoodWheelsAxeHammer2.json",
      "outdoorWoodWheelsAxeHammer3.json",
      "outdoorWoodWheelsAxeHammer4.json",
      "outdoorWoodWheelsAxeHammer5.json",
      "outdoorWoodWheelsAxeHammer6.json",
      "outdoorWoodWheelsAxeHammer7.json",
      "outdoorWoodWheelsAxeHammer8.json",
      "outdoorWoodWheelsAxeHammer9.json",
      "outdoorWoodWheelsAxeHammer10.json",
      "outdoorPlaygroundBeginner1.json",
      "outdoorPlaygroundBeginner2.json",
      "outdoorPlaygroundBeginner3.json",
      "outdoorPlaygroundIntermediate1.json",
      "outdoorPlaygroundIntermediate2.json",
      "outdoorPlaygroundIntermediate3.json",
      "outdoorPlaygroundAdvanced1.json",
      "outdoorPlaygroundAdvanced2.json",
      "outdoorPlaygroundAdvanced3.json",
      "outdoorPlaygroundPro1.json",
      "outdoorPlaygroundPro2.json",
      "outdoorBeachBeginner1.json",
      "outdoorBeachBeginner2.json",
      "outdoorBeachBeginner3.json",
      "outdoorBeachIntermediate1.json",
      "outdoorBeachIntermediate2.json",
      "outdoorBeachIntermediate3.json",
      "outdoorBeachAdvanced1.json",
      "outdoorBeachAdvanced2.json",
      "outdoorBeachAdvanced3.json",
      "outdoorBeachPro1.json",
      "outdoorBeachPro2.json",
      "outdoorFightBeginner1.json",
      "outdoorFightBeginner2.json",
      "outdoorFightBeginner3.json",
      "outdoorFightIntermediate1.json",
      "outdoorFightIntermediate2.json",
      "outdoorFightIntermediate3.json",
      "outdoorFightAdvanced1.json",
      "outdoorFightAdvanced2.json",
      "outdoorFightAdvanced3.json",
      "outdoorFightPro1.json",
      "outdoorTrackAndField.json",
      "outdoorPoolBeginner1.json",
      "outdoorPoolBeginner2.json",
      "outdoorPoolBeginner3.json",
      "outdoorPoolBeginner4.json",
      "outdoorPoolBeginner5.json",
      "outdoorPoolBeginner6.json",
      "outdoorPoolBeginner7.json",
      "outdoorPoolBeginner8.json",
      "outdoorPoolBeginner9.json",
      "outdoorPoolBeginner10.json",
      "outdoorRunningBeginner1.json",
      "outdoorRunningBeginner2.json",
      "outdoorRunningBeginner3.json",
      "outdoorRunningBeginner4.json",
      "outdoorRunningBeginner5.json",
      "outdoorRunningBeginner6.json",
      "outdoorRunningBeginner7.json",
      "outdoorRunningBeginner8.json",
      "outdoorRunningBeginner9.json",
      "outdoorRunningBeginner10.json",
    ];
  }, []);

  // Optional discovery via index.json → then fall back to STATIC_FILES
  const discoverFiles = async () => {
    try {
      const r = await fetch("/ProgramData/index.json", { cache: "no-store" });
      if (!r.ok) throw new Error("no index");
      const j = await r.json();
      const list = [];
      (j?.categories || []).forEach((cat) => {
        (cat.subcategories || []).forEach((sub) => {
          // naive expansion: we don't have actual filenames, so fallback to static when unknown
          // keep this as a hook to evolve later (server can return explicit files)
        });
      });
      // If index doesn't enumerate explicit files, keep fallback
      if (!list.length) return STATIC_FILES;
      return list;
    } catch (_) {
      return STATIC_FILES;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const filenames = await discoverFiles();
      const results = await Promise.all(
        filenames.map(async (f) => {
          try {
            const res = await fetch(`/ProgramData/${f}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const type = res.headers.get("content-type") || "";
            if (!type.includes("application/json")) throw new Error(`Invalid content-type: ${type}`);
            const json = await res.json();
            // attach source for dedupe & debugging
            return { ...json, _src: f };
          } catch (e) {
            console.error(`❌ Failed to load ${f}:`, e.message || e);
            return null;
          }
        })
      );

      if (!mounted) return;
      const valid = results.filter((p) => p && p.category);
      // dedupe strictly by source filename
      const map = new Map();
      for (const p of valid) {
        if (!map.has(p._src)) map.set(p._src, p);
      }
      const deduped = Array.from(map.values());
      setPrograms(deduped);
      // if URL lacks cat, default to first category present
      if (!new URLSearchParams(window.location.search).get("cat") && deduped.length) {
        const firstCat = deduped[0].category?.toLowerCase?.() || "gym";
        setCategory(firstCat);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Categories/subcategories derived from data
  const categories = useMemo(() => {
    return [...new Set(programs.map((p) => String(p.category || "").toLowerCase()))].sort();
  }, [programs]);

  const subcategories = useMemo(() => {
    return [...new Set(programs
      .filter((p) => String(p.category || "").toLowerCase() === category)
      .map((p) => String(p.subcategory || "").toLowerCase())
      .filter(Boolean))].sort();
  }, [programs, category]);

  // Normalize level → rank for better sorting (Beginner < Intermediate < Advanced < Pro < Elite)
  const levelRank = (lvl) => {
    const L = String(lvl || "").toLowerCase();
    if (/(elite|platinum)/.test(L)) return 5;
    if (/pro/.test(L)) return 4;
    if (/advanced/.test(L)) return 3;
    if (/intermediate/.test(L)) return 2;
    if (/beginner/.test(L)) return 1;
    return 0;
  };

  const filteredPrograms = programs.filter((p) => {
    const catOk = String(p.category || "").toLowerCase() === category;
    const subOk = !subcategory || String(p.subcategory || "").toLowerCase() === subcategory;
    const accessOk = isAdmin || hasAccess(tier, p.accessTier || p.tier || "Free");
    return catOk && subOk && accessOk;
  });

  const sortedPrograms = filteredPrograms
    .slice()
    .sort((a, b) => {
      const aL = levelRank(a.level);
      const bL = levelRank(b.level);
      if (aL !== bL) return aL - bL;
      const aP = Number(a.phase ?? 0);
      const bP = Number(b.phase ?? 0);
      if (aP !== bP) return aP - bP;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

  // Pretty label
  const labelize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div className="p-4">
      {isAdmin && (
        <div className="flex justify-center mb-4 gap-2 items-center">
          <label className="text-sm text-gray-500 dark:text-gray-300">Tier Preview:</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm shadow-sm bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="Free">Free</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
          <span className="text-xs opacity-70">(Hierarchy active)</span>
        </div>
      )}

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border shadow-sm transition-all duration-300 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
              ${category === cat
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent"
                : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300"}`}
            onClick={() => setCategory(cat)}
          >
            {labelize(cat)}
          </motion.button>
        ))}
      </div>

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <motion.button
            key="__all__"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 shadow-sm
              ${!subcategory
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent"
                : "bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300"}`}
            onClick={() => setSubcategory("")}
          >
            All
          </motion.button>

          {subcategories.map((sub) => (
            <motion.button
              key={sub}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 overflow-hidden
                ${subcategory === sub
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent"
                  : "bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300"}`}
              onClick={() => setSubcategory(sub)}
            >
              <span className="relative z-10">{labelize(sub)}</span>
              {subcategory !== sub && (
                <span className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      ) : sortedPrograms.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">No programs available for this view.</div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={category + (subcategory || "")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {sortedPrograms.map((program, index) => (
              <ProgramCard
                key={program._src || index}
                program={program}
                userTier={tier}
                selectedCategory={category}
                isAdmin={isAdmin}
                debugMode={isAdmin}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
