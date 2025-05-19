import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Κρύψε το Navbar στη landing σελίδα
  if (location.pathname === "/") return null;

  return (
    <div className={`w-full px-4 py-3 flex justify-between items-center border-b ${theme === "dark" ? "bg-black text-white border-gray-700" : "bg-white text-black border-gray-200"}`}>
      <button
        onClick={() => navigate("/")}
        className="text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition"
      >
        Health's Spot 🧀
      </button>

      <button
        onClick={toggleTheme}
        className="bg-yellow-500 text-black px-3 py-1 rounded font-semibold hover:bg-yellow-600"
      >
        {theme === "dark" ? "Light" : "Dark"} Mode
      </button>
    </div>
  );
}
