import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import logo from "./assets/logo.png";

const modules = [
  { icon: "🔥", name: "FIT MENU", path: "/dashboard" },
  { icon: "📚", name: "Training", path: "/programs" }, // ✅ ΝΕΟ
  { icon: "🏋️", name: "Power", path: "/training" },
  { icon: "🏊", name: "Cardio", path: "/cardio" },
  { icon: "🍎", name: "Nutrition", path: "/nutrition" },
  { icon: "🥂", name: "Recovery", path: "/recovery" },
  { icon: "📄", name: "Export", path: "/export" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Κρύψε μόνο στη landing "/"
  if (location.pathname === "/") return null;

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-48 z-50 flex flex-col items-start px-4 py-6 border-r shadow-md transition-all duration-300
        ${theme === "dark" ? "bg-black text-white border-gray-700" : "bg-white text-black border-gray-200"}`}
    >
      {/* Logo + App Name */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-2 cursor-pointer mb-6"
      >
        <img src={logo} alt="logo" className="w-8 h-8 rounded" />
        <span className="text-yellow-400 font-bold text-lg">Health's Spot</span>
      </div>

      {/* Sidebar Module Navigation */}
      <div className="flex flex-col gap-3 w-full">
        {modules.map((mod) => (
          <button
            key={mod.name}
            onClick={() => navigate(mod.path)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white shadow w-full text-left"
          >
            <span className="text-lg">{mod.icon}</span> {mod.name}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="mt-auto text-sm px-3 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold w-full"
      >
        {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
      </button>
    </div>
  );
}
