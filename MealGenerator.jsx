// Meal Generator Advanced Tab

import React, { useState } from 'react';

export default function MealGeneratorAdvanced() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-yellow-600">🍱 Προηγμένος Δημιουργός Πλάνου</h1>

      {/* Section 1: User Preferences */}
      <section className="bg-yellow-100 dark:bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">⚙️ Προτιμήσεις</h2>
        {/* Tags: vegetarian, low carb, etc. */}
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-yellow-400">Χορτοφαγικό</button>
          <button className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-yellow-400">Χαμηλό σε λιπαρά</button>
          <button className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-yellow-400">Γρήγορο</button>
        </div>
      </section>

      {/* Section 2: Meal Suggestions */}
      <section className="bg-yellow-100 dark:bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">🧠 AI Προτάσεις για Πιάτα</h2>
        {/* Sample placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <img src="https://via.placeholder.com/100" alt="meal" className="w-full rounded mb-2" />
            <h3 className="font-bold">🍗 Κοτόπουλο με Ρύζι</h3>
            <p className="text-sm">450 kcal • 35g Π • 10g Λ • 40g Υ</p>
            <div className="mt-2 flex justify-between text-xs">
              <button className="bg-blue-500 text-white px-2 py-1 rounded">➕ Προσθήκη</button>
              <button className="bg-gray-200 text-gray-800 px-2 py-1 rounded">🔁 Αντικατάσταση</button>
            </div>
          </div>
          {/* Add more dynamically later */}
        </div>
      </section>

      {/* Section 3: Export & Save */}
      <section className="bg-yellow-100 dark:bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">📤 Εξαγωγή / Αποθήκευση</h2>
        <div className="flex gap-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">💾 Αποθήκευση</button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">📥 PDF Export</button>
        </div>
      </section>
    </div>
  );
}
