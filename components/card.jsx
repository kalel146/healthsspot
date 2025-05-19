import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";

export default function Card({ label, value }) {
  const { theme } = useTheme();

  const baseCard =
    theme === "dark"
      ? "bg-gray-800 text-white"
      : "bg-gray-200 text-black";
  const labelStyle =
    theme === "dark" ? "text-gray-400" : "text-gray-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center ${baseCard}`}
    >
      <div className={`text-sm ${labelStyle}`}>{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </motion.div>
  );
}
