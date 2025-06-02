// Notifications.jsx
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

export default function Notifications({ prMessage, recoveryWarning, weekType }) {
  useEffect(() => {
    if (prMessage) {
      toast.success(`🎯 Νέο PR: ${prMessage}`);
    }
  }, [prMessage]);

  useEffect(() => {
    if (recoveryWarning) {
      toast.error("⚠️ Χαμηλό Recovery για 4+ ημέρες! Πρότεινε Deload");
    }
  }, [recoveryWarning]);

  useEffect(() => {
    if (weekType === "Deload Εβδομάδα") {
      toast("🧘‍♂️ Deload Εβδομάδα: Χαμήλωσε ένταση, εστίασε σε αποκατάσταση");
    } else if (weekType === "Overload Εβδομάδα") {
      toast("🔥 Overload Εβδομάδα: Πίεσε λίγο παραπάνω, πρόσεχε την τεχνική!");
    }
  }, [weekType]);

  return null; // Notifications handled via toasts
}
