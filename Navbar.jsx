import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import logo from "./assets/logo.png";
import { HiMenu, HiX } from "react-icons/hi";

const modules = [
  { icon: "🔥", name: "FIT MENU", path: "/dashboard" },
  { icon: "📚", name: "Training", path: "/programs" },
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
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  if (location.pathname === "/") return null;

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        className="fixed top-4 left-4 z-[60] p-2 rounded bg-yellow-500 text-black md:hidden shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? <HiX size={24} /> : <HiMenu size={24} />}
      </button>

      {/* Backdrop on Mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col items-center py-4 border-r shadow-md transition-all duration-300
        ${theme === "dark" ? "bg-black text-white border-gray-700" : "bg-white text-black border-gray-200"}
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex md:flex-col
        ${minimized ? "w-16 px-2" : "w-48 px-4"}`}
      >
        {/* Logo & Minimize */}
        <div
          onClick={() => navigate("/")}
          className={`flex items-center gap-2 cursor-pointer mb-6 ${minimized ? "justify-center" : "justify-start"}`}
        >
          <img src={logo} alt="logo" className="w-8 h-8 rounded" />
          {!minimized && <span className="text-yellow-400 font-bold text-lg">Health's Spot</span>}
        </div>

        {/* Toggle Minimize */}
        <button
          onClick={() => setMinimized(!minimized)}
          className="mb-6 text-xs text-yellow-400 hover:text-yellow-300"
        >
          {minimized ? "➡️" : "⬅️"}
        </button>

        {/* Modules */}
        <div className="flex flex-col gap-3 w-full">
          {modules.map((mod) => (
            <button
              key={mod.name}
              onClick={() => {
                navigate(mod.path);
                setOpen(false);
              }}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white shadow w-full text-left"
            >
              <span className="text-lg text-center w-full">{mod.icon}</span>
              {!minimized && <span>{mod.name}</span>}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className={`mt-auto text-sm px-3 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold w-full ${minimized ? "text-center text-xs" : ""}`}
        >
          {minimized ? (theme === "dark" ? "☀" : "🌙") : theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </>
  );
}
