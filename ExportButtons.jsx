import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportButtons({ logData }) {
  const exportAllLogsToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Ημερομηνία", "Άσκηση", "Βάρος", "Επαναλήψεις", "1RM"];
    const tableRows = logData.map((entry) => [
      entry.date,
      entry.exercise,
      entry.weight,
      entry.reps,
      entry.maxOneRM
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("strength-logs.pdf");
  };

  const exportAllLogsToCSV = () => {
    const csvRows = ["Ημερομηνία,Άσκηση,Βάρος,Επαναλήψεις,1RM"];
    logData.forEach((entry) => {
      csvRows.push(`${entry.date},${entry.exercise},${entry.weight},${entry.reps},${entry.oneRM}`);
    });
    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "strength-logs.csv";
    link.click();
  };

  return (
    <div className="flex justify-end space-x-3">
      <button onClick={exportAllLogsToPDF} className="px-4 py-2 rounded bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700">
        🧾 Export Όλων (PDF)
      </button>
      <button onClick={exportAllLogsToCSV} className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
        📂 Export Όλων (CSV)
      </button>
    </div>
  );
}
