import React, { useState } from "react";

export default function ExportButtons({ logData = [] }) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const exportAllLogsToPDF = async () => {
    if (isExportingPdf) return;

    try {
      setIsExportingPdf(true);

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      const tableColumn = ["Ημερομηνία", "Άσκηση", "Βάρος", "Επαναλήψεις", "1RM"];

      const tableRows = logData.map((entry) => [
        entry.date ?? "-",
        entry.exercise ?? "-",
        entry.weight ?? "-",
        entry.reps ?? "-",
        entry.maxOneRM ?? entry.oneRM ?? "-",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
      });

      doc.save("strength-logs.pdf");
    } catch (error) {
      console.error("Export PDF failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportAllLogsToCSV = async () => {
    if (isExportingCsv) return;

    try {
      setIsExportingCsv(true);

      const csvRows = ["Ημερομηνία,Άσκηση,Βάρος,Επαναλήψεις,1RM"];
      logData.forEach((entry) => {
        csvRows.push(
          [
            entry.date ?? "-",
            entry.exercise ?? "-",
            entry.weight ?? "-",
            entry.reps ?? "-",
            entry.maxOneRM ?? entry.oneRM ?? "-",
          ].join(",")
        );
      });

      const csvData = csvRows.join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "strength-logs.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export CSV failed:", error);
      alert("Αποτυχία εξαγωγής CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="flex justify-end space-x-3">
      <button
        onClick={exportAllLogsToPDF}
        disabled={isExportingPdf}
        className="px-4 py-2 rounded bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isExportingPdf ? "Exporting PDF..." : "🧾 Export Όλων (PDF)"}
      </button>

      <button
        onClick={exportAllLogsToCSV}
        disabled={isExportingCsv}
        className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isExportingCsv ? "Exporting CSV..." : "📂 Export Όλων (CSV)"}
      </button>
    </div>
  );
}