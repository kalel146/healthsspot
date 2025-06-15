import React from "react";

const PlanDayCard = ({ day, customMeals, allFoods }) => {
  const meals = ["breakfast", "lunch", "snack", "dinner"];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-4">
      <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2">{day}</h3>
      <ul className="space-y-2">
        {meals.map((meal) => {
          const key = `${day}-${meal}`;
          const foodName = customMeals[key];
          const food = allFoods.find((f) => f.name === foodName);

          return (
            <li key={key} className="text-sm">
              <strong>{meal}:</strong>{" "}
              {foodName ? (
                <>
                  {foodName} —{" "}
                  {food
                    ? `${food.protein}g P, ${food.fat}g F, ${food.carbs}g C`
                    : "τροφή μη καταχωρημένη"}
                </>
              ) : (
                "⛔ δεν έχει οριστεί"
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlanDayCard;
