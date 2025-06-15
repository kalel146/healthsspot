import React from "react";

const PreferenceSelector = ({ value, onChange, tooltip }) => {
  return (
    <div className="mt-4">
      <label htmlFor="preference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Προτίμηση Διατροφής
        <span className="ml-1 text-gray-500" title={tooltip}>ⓘ</span>
      </label>
      <select
        id="preference"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 p-2 border rounded w-full dark:bg-gray-800 dark:text-white"
      >
        <option value="none">Καμία</option>
        <option value="vegetarian">Χορτοφαγική</option>
        <option value="lowcarb">Χαμηλών Υδατανθράκων</option>
        <option value="highprotein">Υψηλής Πρωτεΐνης</option>
        <option value="mediterranean">Μεσογειακή</option>
      </select>
    </div>
  );
};

export default PreferenceSelector;
