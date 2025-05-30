// exportCardioToCSV.js

export function exportCardioToCSV(data) {
  if (!data || data.length === 0) {
    alert("Δεν υπάρχουν δεδομένα για εξαγωγή.");
    return;
  }

  const headers = ["Ημερομηνία", "Δραστηριότητα", "VO2max", "Θερμίδες"];

  const rows = data.map((entry) => [
    entry.date,
    entry.activity,
    entry.VO2,
    entry.kcal
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "cardio_history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
