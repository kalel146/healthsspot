import React from "react";

export default function BmrTdeeSection({
  sectionStyle,
  theme,
  inputStyle,
  weight,
  setWeight,
  height,
  setHeight,
  age,
  setAge,
  gender,
  setGender,
  activity,
  setActivity,
  calculateNutrition,
  bmr,
  tdee,
}) {
  const forcedInputStyle =
    theme === "dark"
      ? {
          backgroundColor: "#27272a",
          color: "#f4f4f5",
          WebkitTextFillColor: "#f4f4f5",
          caretColor: "#facc15",
        }
      : {
          backgroundColor: "#ffffff",
          color: "#18181b",
          WebkitTextFillColor: "#18181b",
          caretColor: "#facc15",
        };

  return (
    <details
      open
      className={`${sectionStyle} ${
        theme === "dark" ? "bg-gray-900" : "bg-yellow-100"
      } rounded-xl p-4 shadow-md transition-all`}
    >
      <summary className="text-xl sm:text-2xl font-semibold cursor-pointer">
        🧮 Υπολογισμός BMR / TDEE
      </summary>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <label className="block mb-1 font-medium">⚖️ Βάρος (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            placeholder="π.χ. 70"
            className={inputStyle}
            style={forcedInputStyle}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">📏 Ύψος (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            placeholder="π.χ. 175"
            className={inputStyle}
            style={forcedInputStyle}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">🎂 Ηλικία</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            placeholder="π.χ. 25"
            className={inputStyle}
            style={forcedInputStyle}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">👤 Φύλο</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={inputStyle}
            style={forcedInputStyle}
          >
            <option value="male">Άνδρας</option>
            <option value="female">Γυναίκα</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-1 font-medium">
            🏃‍♂️ Επίπεδο δραστηριότητας
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
            className={inputStyle}
            style={forcedInputStyle}
          >
            <option value={1.2}>Καθιστική ζωή</option>
            <option value={1.375}>Ελαφριά δραστηριότητα</option>
            <option value={1.55}>Μέτρια δραστηριότητα</option>
            <option value={1.725}>Έντονη δραστηριότητα</option>
            <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-4 items-center mt-2">
          <button
            onClick={calculateNutrition}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow-sm"
          >
            🔍 Υπολόγισε
          </button>

          {bmr !== null && tdee !== null && (
            <p className="mt-2 text-sm">
              <strong>BMR:</strong> {bmr} kcal | <strong>TDEE:</strong> {tdee} kcal
            </p>
          )}
        </div>
      </div>
    </details>
  );
}