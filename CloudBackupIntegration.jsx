import React, { useState } from "react";

export default function CloudBackupIntegration() {
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [status, setStatus] = useState("");

  const handleToggle = () => {
    setCloudEnabled((prev) => !prev);
    setStatus("Σύνδεση σε εξέλιξη...");
    setTimeout(() => {
      setStatus("Επιτυχής συγχρονισμός με Cloud Backup (mock)");
    }, 2000);
  };

  return (
    <div className="bg-black text-white min-h-screen px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Cloud Backup</h1>

      <section className="space-y-4 text-center">
        <p className="text-lg">Ενεργοποίησε το αυτόματο συγχρονισμό με Google Drive ή iCloud</p>
        <button
          onClick={handleToggle}
          className={`px-6 py-3 rounded font-bold text-white ${
            cloudEnabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {cloudEnabled ? "Απενεργοποίηση Cloud Sync" : "Ενεργοποίηση Cloud Sync"}
        </button>
        <p className="text-sm text-gray-400 mt-4">{status}</p>
      </section>

      <section className="mt-10 text-center">
        <h2 className="text-xl font-semibold mb-4">Mock Αρχείο προς Συγχρονισμό</h2>
        <div className="bg-gray-800 p-4 rounded">
          <p>Filename: user_data_backup.json</p>
          <p>Περιεχόμενο: [μετρήσεις, πλάνα διατροφής, self-reports κ.ά.]</p>
        </div>
      </section>
    </div>
  );
}
