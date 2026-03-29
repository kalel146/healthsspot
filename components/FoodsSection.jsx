import React from "react";
import CollapsibleSection from "../CollapsibleSection";
import { Tabs, Tab } from "../TabsComponent";
import { toNum, fmtG, kcalOf } from "../utils/nutritionFormatters";

export default function FoodsSection({
  inputStyle,
  foodSearch,
  setFoodSearch,
  newFood,
  setNewFood,
  addCustomFood,
  selectedDay,
  setSelectedDay,
  selectedMealType,
  setSelectedMealType,
  daysOrder,
  userFoods,
  setUserFoods,
  setCustomMeals,
  sectionStyle,
  borderCol,
  headBg,
  headText,
  cellText,
  rowAltBg,
  rowBg,
}) {
  return (
    <Tabs defaultTab="🥫 Τρόφιμα">
      <Tab label="🥫 Τρόφιμα">
        <CollapsibleSection title="🍽️ Προσθήκη Τροφίμων">
          <input
            type="text"
            placeholder="Αναζήτησε τρόφιμο..."
            className={`p-2 w-full rounded ${inputStyle}`}
            value={foodSearch}
            onChange={(e) => setFoodSearch(e.target.value)}
          />
          <div className="grid grid-cols-5 gap-2 text-xs mb-4 mt-2">
            <input placeholder="Όνομα" className={inputStyle} value={newFood.name} onChange={(e) => setNewFood((s) => ({ ...s, name: e.target.value }))} />
            <input placeholder="P" className={inputStyle} type="number" value={newFood.protein} onChange={(e) => setNewFood((s) => ({ ...s, protein: e.target.value }))} />
            <input placeholder="F" className={inputStyle} type="number" value={newFood.fat} onChange={(e) => setNewFood((s) => ({ ...s, fat: e.target.value }))} />
            <input placeholder="C" className={inputStyle} type="number" value={newFood.carbs} onChange={(e) => setNewFood((s) => ({ ...s, carbs: e.target.value }))} />
            <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={addCustomFood}>➕ Προσθήκη</button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="🗓️ Αντιστοίχιση Γευμάτων">
          <div className="flex gap-2 mb-4">
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className={`p-2 rounded ${inputStyle}`}>
              {daysOrder.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>

            <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)} className={`p-2 rounded ${inputStyle}`}>
              <option value="breakfast">Πρωινό</option>
              <option value="lunch">Μεσημεριανό</option>
              <option value="snack">Σνακ</option>
              <option value="dinner">Βραδινό</option>
            </select>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="📦 Λίστα Τροφίμων (user + default)">
          <div className={`${sectionStyle} p-0 overflow-hidden`}>
            <table className={`w-full text-sm border ${borderCol}`}>
              <thead className={`${headBg} ${headText} sticky top-0 z-10`}>
                <tr>
                  <th className="p-2 text-left">Τρόφιμο</th>
                  <th className="p-2 text-right">Πρωτεΐνη</th>
                  <th className="p-2 text-right">Λίπος</th>
                  <th className="p-2 text-right">Υδατ.</th>
                  <th className="p-2 text-right">Ενέργεια</th>
                  <th className="p-2 text-center">Ενέργειες</th>
                </tr>
              </thead>

              <tbody className={`${cellText}`}>
                {userFoods.map((item, i) => {
                  const p = toNum(item.protein);
                  const f = toNum(item.fat);
                  const c = toNum(item.carbs);
                  const odd = i % 2 === 1;
                  return (
                    <tr key={`u-${i}`} className={`${odd ? rowAltBg : rowBg} border-t ${borderCol}`}>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 text-right">{fmtG(p)}</td>
                      <td className="p-2 text-right">{fmtG(f)}</td>
                      <td className="p-2 text-right">{fmtG(c)}</td>
                      <td className="p-2 text-right">{kcalOf({ protein: p, fat: f, carbs: c })}</td>
                      <td className="p-2">
                        <div className="flex gap-1 justify-center">
                          <button
                            className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
                            title="Προσθήκη στο Πλάνο"
                            onClick={() => {
                              const mealKey = `${selectedDay}-${selectedMealType}`;
                              setCustomMeals((prev) => ({ ...prev, [mealKey]: item.name }));
                            }}
                          >
                            ➕ Στο Πλάνο
                          </button>
                          <button
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            title="Επεξεργασία Τροφίμου"
                            onClick={() => {
                              const newName = prompt("✏️ Νέο όνομα:", item.name);
                              const newProtein = Number(prompt("Πρωτεΐνη (g):", p));
                              const newFat = Number(prompt("Λίπος (g):", f));
                              const newCarbs = Number(prompt("Υδατάνθρακες (g):", c));
                              if (!newName?.trim() || !Number.isFinite(newProtein) || !Number.isFinite(newFat) || !Number.isFinite(newCarbs)) return;
                              const updated = [...userFoods];
                              updated[i] = {
                                name: newName.trim(),
                                protein: Math.max(0, newProtein),
                                fat: Math.max(0, newFat),
                                carbs: Math.max(0, newCarbs),
                              };
                              setUserFoods(updated);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            title="Διαγραφή Τροφίμου"
                            onClick={() => setUserFoods((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      </Tab>
    </Tabs>
  );
}
