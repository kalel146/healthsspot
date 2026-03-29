import React, { useMemo } from "react";

const formatTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

const getToneClasses = (tone = "neutral") => {
  if (tone === "positive") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (tone === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (tone === "danger") return "border-red-500/30 bg-red-500/10 text-red-200";
  return "border-zinc-400/30 bg-zinc-500/10 text-zinc-200";
};

function MetricCard({ ui, label, value, detail, tone = "neutral" }) {
  return (
    <div className={ui.metricCard + " min-h-[112px] flex flex-col justify-between"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={ui.helper + " uppercase tracking-[0.14em]"}>{label}</div>
          <div className="mt-2 text-xl font-bold tracking-tight">{value}</div>
        </div>
        <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide " + getToneClasses(tone)}>
          {tone === "positive" ? "OK" : tone === "warning" ? "Watch" : tone === "danger" ? "Alert" : "Info"}
        </span>
      </div>
      <div className={ui.mutedText + " mt-3 leading-relaxed"}>{detail}</div>
    </div>
  );
}

export default function NutritionStatusBar({
  ui,
  userId,
  localStatus,
  lastLocalSavedAt,
  cloudStatus,
  lastCloudSyncAt,
  foodsTotal,
  customFoodsCount,
  filledMeals,
  totalMealSlots,
  planKcal,
  tdee,
}) {
  const coverage = totalMealSlots > 0 ? Math.round((filledMeals / totalMealSlots) * 100) : 0;
  const energyDelta = Number.isFinite(Number(planKcal)) && Number.isFinite(Number(tdee))
    ? Math.round(Number(planKcal) - Number(tdee))
    : null;

  const localMetric = useMemo(() => {
    if (localStatus === "saving") {
      return {
        value: "Saving…",
        detail: "Οι αλλαγές γράφονται τοπικά ώστε να μην χαθεί το πλάνο σου.",
        tone: "warning",
      };
    }
    if (localStatus === "saved") {
      return {
        value: lastLocalSavedAt ? `Saved ${formatTime(lastLocalSavedAt)}` : "Saved locally",
        detail: "Το local persistence είναι ενεργό και σταθερό.",
        tone: "positive",
      };
    }
    return {
      value: "Local active",
      detail: "Το module λειτουργεί και χωρίς cloud σύνδεση.",
      tone: "neutral",
    };
  }, [localStatus, lastLocalSavedAt]);

  const cloudMetric = useMemo(() => {
    if (!userId) {
      return {
        value: "Offline mode",
        detail: "Cloud sync θα ενεργοποιηθεί μόλις συνδεθείς.",
        tone: "neutral",
      };
    }
    if (cloudStatus === "pending" || cloudStatus === "fetching") {
      return {
        value: cloudStatus === "fetching" ? "Connecting…" : "Sync pending",
        detail: "Γίνεται έλεγχος και συγχρονισμός των nutrition snapshots.",
        tone: "warning",
      };
    }
    if (cloudStatus === "error") {
      return {
        value: "Sync issue",
        detail: "Το local state παραμένει ασφαλές, αλλά το cloud θέλει έλεγχο.",
        tone: "danger",
      };
    }
    if (cloudStatus === "synced") {
      return {
        value: lastCloudSyncAt ? `Synced ${formatTime(lastCloudSyncAt)}` : "Synced",
        detail: "Το nutrition snapshot είναι ευθυγραμμισμένο με το cloud.",
        tone: "positive",
      };
    }
    return {
      value: "Cloud ready",
      detail: "Η σύνδεση υπάρχει και περιμένει επαρκή δεδομένα για sync.",
      tone: "neutral",
    };
  }, [userId, cloudStatus, lastCloudSyncAt]);

  const foodsMetric = {
    value: `${customFoodsCount} custom / ${foodsTotal} total`,
    detail: customFoodsCount > 0
      ? "Η βιβλιοθήκη τροφίμων συνδυάζει default βάση και δικές σου προσθήκες."
      : "Η βάση είναι καθαρή και έτοιμη για custom εμπλουτισμό.",
    tone: customFoodsCount > 0 ? "positive" : "neutral",
  };

  const coverageMetric = {
    value: `${filledMeals}/${totalMealSlots} meals`,
    detail: `Κάλυψη πλάνου ${coverage}% σε εβδομαδιαίο επίπεδο.`,
    tone: coverage >= 85 ? "positive" : coverage >= 50 ? "warning" : "danger",
  };

  const energyMetric = {
    value: energyDelta === null ? "No target yet" : `${energyDelta > 0 ? "+" : ""}${energyDelta} kcal`,
    detail: energyDelta === null
      ? "Χρειάζονται έγκυρα TDEE και γεύματα για σύγκριση στόχου."
      : energyDelta === 0
        ? "Το πλάνο κάθεται ακριβώς πάνω στον ενεργειακό στόχο."
        : energyDelta > 0
          ? "Το πλάνο υπερβαίνει τον στόχο και θέλει επίγνωση στο surplus."
          : "Το πλάνο υπολείπεται του στόχου και θέλει έλεγχο στο deficit.",
    tone: energyDelta === null ? "neutral" : Math.abs(energyDelta) <= 150 ? "positive" : Math.abs(energyDelta) <= 300 ? "warning" : "danger",
  };

  return (
    <section className={ui.section + " max-w-6xl mx-auto"}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">Operational Overview</div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Nutrition control panel</h2>
        </div>
        <p className={ui.mutedText + " max-w-2xl md:text-right"}>
          Γρήγορη εικόνα για αποθήκευση, συγχρονισμό, ποιότητα κάλυψης πλάνου και ενεργειακή στόχευση.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard ui={ui} label="Local persistence" value={localMetric.value} detail={localMetric.detail} tone={localMetric.tone} />
        <MetricCard ui={ui} label="Cloud sync" value={cloudMetric.value} detail={cloudMetric.detail} tone={cloudMetric.tone} />
        <MetricCard ui={ui} label="Foods database" value={foodsMetric.value} detail={foodsMetric.detail} tone={foodsMetric.tone} />
        <MetricCard ui={ui} label="Plan coverage" value={coverageMetric.value} detail={coverageMetric.detail} tone={coverageMetric.tone} />
        <MetricCard ui={ui} label="Energy match" value={energyMetric.value} detail={energyMetric.detail} tone={energyMetric.tone} />
      </div>
    </section>
  );
}
