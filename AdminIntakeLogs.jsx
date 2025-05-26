import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";

const supabase = createClient(
  "https://lfhnlalktlcjyhelblci.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sYWxrdGxjanloZWxibGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI4MjEsImV4cCI6MjA2MzQxODgyMX0.qxOxqg2ObJBUJF5vKcQclIHgJa_1wYGrmWtxSU4Amvg"
);

export default function AdminPanel() {
  const { user } = useUser();
  const [logs, setLogs] = useState([]);

  const ADMIN_ID = "user_2xEWjEu4YPHV4Yos2h0L18osFmZ"; // Update if needed

  useEffect(() => {
    if (user?.id !== ADMIN_ID) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("intake_logs")
        .select("user_id, date, kcal, protein, fat, carbs")
        .order("date", { ascending: false });
      if (!error) setLogs(data);
    };

    fetchLogs();
  }, [user]);

  if (user?.id !== ADMIN_ID) return <p className="p-4 text-red-600">🚫 Δεν έχεις πρόσβαση</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Admin Panel – Intake Logs</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="px-4 py-2 border">User ID</th>
              <th className="px-4 py-2 border">Ημερομηνία</th>
              <th className="px-4 py-2 border">Θερμίδες</th>
              <th className="px-4 py-2 border">Πρωτεΐνη</th>
              <th className="px-4 py-2 border">Λίπος</th>
              <th className="px-4 py-2 border">Υδατάνθρακες</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {logs.map((log, index) => (
              <tr key={index} className="text-center">
                <td className="px-2 py-1 border break-all">{log.user_id}</td>
                <td className="px-2 py-1 border">{log.date}</td>
                <td className="px-2 py-1 border">{log.kcal}</td>
                <td className="px-2 py-1 border">{log.protein}</td>
                <td className="px-2 py-1 border">{log.fat}</td>
                <td className="px-2 py-1 border">{log.carbs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
