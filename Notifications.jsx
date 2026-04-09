import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

const normalizeWeekType = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export default function Notifications({ prMessage, recoveryWarning, weekType }) {
  const lastPrRef = useRef("");
  const lastRecoveryRef = useRef(false);
  const lastWeekTypeRef = useRef("");

  useEffect(() => {
    const message = String(prMessage || "").trim();
    if (!message || lastPrRef.current === message) return;

    lastPrRef.current = message;
    toast.success(`🎯 Νέο PR: ${message}`, {
      id: `pr-${message}`,
      duration: 3500,
    });
  }, [prMessage]);

  useEffect(() => {
    const shouldWarn = Boolean(recoveryWarning);
    if (!shouldWarn || lastRecoveryRef.current === shouldWarn) return;

    lastRecoveryRef.current = shouldWarn;
    toast.error("⚠️ Χαμηλό Recovery για 4+ ημέρες! Πρότεινε Deload.", {
      id: "recovery-warning",
      duration: 4200,
    });
  }, [recoveryWarning]);

  useEffect(() => {
    const normalized = normalizeWeekType(weekType);
    if (!normalized || lastWeekTypeRef.current === normalized) return;

    lastWeekTypeRef.current = normalized;

    if (normalized.includes("deload")) {
      toast("🧘‍♂️ Deload εβδομάδα: χαμήλωσε ένταση και δώσε χώρο στην αποκατάσταση.", {
        id: "weektype-deload",
        duration: 3600,
      });
      return;
    }

    if (normalized.includes("overload")) {
      toast("🔥 Overload εβδομάδα: πίεσε λίγο παραπάνω, αλλά όχι σαν καμικάζι.", {
        id: "weektype-overload",
        duration: 3600,
      });
    }
  }, [weekType]);

  return null;
}
