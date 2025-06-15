import React from "react";

const MacroSlider = ({ label, value, setValue, min, max, step, tooltip, labelFunction }) => {
  return (
    <div className="my-4">
      <div className="flex justify-between items-center">
        <label className="font-medium text-gray-700 dark:text-gray-200">
          {label} <span title={tooltip} className="text-sm text-gray-500 cursor-help">ⓘ</span>
        </label>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {labelFunction ? labelFunction(value) : value}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-yellow-300 rounded-lg appearance-none cursor-pointer dark:bg-yellow-500"
      />
    </div>
  );
};

export default MacroSlider;
