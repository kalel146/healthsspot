import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import logo from "./assets/logo.png";

const modules = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Strength", path: "/training" },
  { name: "Cardio", path: "/cardio" },
  { name: "Nutrition", path: "/nutrition" },
  { name: "Recovery", path: "/recovery" },
  { name: "Export", path: "/export" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Κρύψε μόνο στη landing "/"
  if (location.pathname === "/") return null;

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 border-b shadow-md ${
        theme === "dark"
          ? "bg-black text-white border-gray-700"
          : "bg-white text-black border-gray-200"
      }`}
    >
      {/* Logo + App Name */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-2 cursor-pointer"
      >
        <img src={logo} alt="logo" className="w-6 h-6 rounded" />
        <span className="text-yellow-400 font-bold text-lg">Health's Spot</span>
      </div>

      {/* Full Module Nav with Dashboard included */}
      <div className="hidden md:flex gap-2">
        {modules.map((mod) => (
          <button
            key={mod.name}
            onClick={() => navigate(mod.path)}
            className="text-sm font-medium px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white shadow"
          >
            {mod.name}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
      >
        {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
      </button>
    </div>
  );
}
