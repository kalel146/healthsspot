import React, { useState, useEffect } from "react";
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

export default function Navbar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [canRender, setCanRender] = useState(false);
  

  useEffect(() => setOpen(isOpen), [isOpen]);
  useEffect(() => setCanRender(true), []);

  if (!canRender || typeof window === "undefined" || location.pathname === "/") return null;

  const drawerClasses = `fixed top-0 left-0 z-50 w-64 max-w-[75%] h-screen p-4 pt-20 space-y-4 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out
  ${theme === "dark" ? "bg-gray-900/95 backdrop-blur-md" : "bg-white/90 backdrop-blur-md"}
  ${open ? "translate-x-0" : "-translate-x-full"} lg:hidden`;

  return (
    <>
      {/* ☰ Toggle Button (mobile + tablets) */}
      <button
        className="fixed top-4 left-4 z-[60] p-2 rounded bg-yellow-500 text-black lg:hidden shadow-md"
        onClick={() => {
          setOpen(!open);
          if (onClose) onClose(!open);
        }}
      >
        {open ? <HiX size={24} /> : <HiMenu size={24} />}
      </button>

      {/* Dark backdrop when drawer open (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => {
            setOpen(false);
            if (onClose) onClose(false);
          }}
        />
      )}

      {/* Sidebar (desktop) */}
      <div
        className={`hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen z-40 p-4 pt-6 shadow-2xl overflow-y-auto
        ${theme === "dark" ? "bg-gray-900/95" : "bg-white/90"} backdrop-blur-md`}
      >
        <div
          className="flex items-center gap-2 mb-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="logo" className="w-10 h-10 rounded" />
          <span className="text-yellow-400 font-bold text-lg whitespace-nowrap">Health's Spot</span>
        </div>
         {modules.map((mod) => (
          <button
            key={mod.name}
            onClick={() => {
              navigate(mod.path);
              setOpen(false);
              if (onClose) onClose(false);
            }}
            className="flex items-center gap-2 text-base font-medium px-3 py-2 mb-2 rounded bg-gray-800 text-white hover:bg-gray-700 shadow"
          >
            <span className="text-lg whitespace-nowrap">{mod.icon}</span>
            <span className="whitespace-nowrap">{mod.name}</span>
          </button>
        ))}

        <button
          onClick={toggleTheme}
          className="mt-auto text-sm px-3 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
        >
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Drawer (mobile only) */}
      <div className={drawerClasses}>
        <div
          className="flex items-center gap-2 mb-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="logo" className="w-10 h-10 rounded" />
          <span className="text-yellow-400 font-bold text-lg whitespace-nowrap">Health's Spot</span>
        </div>
        {modules.map((mod) => (
          <button
            key={mod.name}
            onClick={() => {
              navigate(mod.path);
              setOpen(false);
              if (onClose) onClose(false);
            }}
            className="flex items-center gap-2 text-base font-medium px-3 py-2 mb-2 rounded bg-gray-800 text-white hover:bg-gray-700 shadow"
          >
            <span className="text-lg whitespace-nowrap">{mod.icon}</span>
            <span className="whitespace-nowrap">{mod.name}</span>
          </button>
        ))}

        <button
          onClick={toggleTheme}
          className="mt-auto text-sm px-3 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
        >
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </>
  );
}
