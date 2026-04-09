import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useUser } from "@clerk/clerk-react";
import logo from "./assets/logo.png";
import { HiMenu, HiX } from "react-icons/hi";

const ADMIN_EMAIL_ALLOWLIST = ["giannis@admin.dev"];

const modules = [
  { icon: "🔥", name: "FIT MENU", path: "/dashboard", minLevel: "basic" },
  { icon: "📚", name: "Training", path: "/programs", minLevel: "basic" },
  { icon: "🏋️", name: "Power", path: "/training", minLevel: "basic" },
  { icon: "🏊", name: "Cardio", path: "/cardio", minLevel: "basic" },
  { icon: "🍎", name: "Nutrition", path: "/nutrition", minLevel: "basic" },
  { icon: "🥂", name: "Recovery", path: "/recovery", minLevel: "basic" },
  { icon: "📄", name: "Export", path: "/export", minLevel: "pro" },
  { icon: "🔐", name: "Admin", path: "/admin", minLevel: "admin" },
];

const levelRank = {
  basic: 1,
  pro: 2,
  elite: 3,
  admin: 99,
};

const hiddenRoutes = new Set(["/", "/sign-in", "/sign-up"]);

function getUserLevel(user) {
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase?.() || "";
  const publicRole = String(user?.publicMetadata?.role || "").toLowerCase();
  const unsafeRole = String(user?.unsafeMetadata?.role || "").toLowerCase();
  const publicLevel = String(user?.publicMetadata?.userLevel || "").toLowerCase();
  const unsafeLevel = String(user?.unsafeMetadata?.userLevel || "").toLowerCase();

  if (
    ADMIN_EMAIL_ALLOWLIST.includes(email) ||
    publicRole === "admin" ||
    unsafeRole === "admin" ||
    publicLevel === "admin" ||
    unsafeLevel === "admin"
  ) {
    return "admin";
  }

  const level = publicLevel || unsafeLevel || "basic";
  return levelRank[level] ? level : "basic";
}

function NavButton({ item, active, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-yellow-500 text-black shadow"
          : theme === "dark"
          ? "bg-zinc-900 text-white hover:bg-zinc-800"
          : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
      }`}
    >
      <span className="text-lg">{item.icon}</span>
      <span className="whitespace-nowrap">{item.name}</span>
    </button>
  );
}

export default function Navbar({ isOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, isLoaded } = useUser();

  const [open, setOpen] = useState(isOpen);
  const [mounted, setMounted] = useState(false);

  const userLevel = useMemo(() => getUserLevel(user), [user]);

  const visibleModules = useMemo(() => {
    const rank = levelRank[userLevel] || 1;
    return modules.filter((item) => {
      const minRank = levelRank[item.minLevel] || 1;
      return rank >= minRank;
    });
  }, [userLevel]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(Boolean(isOpen));
  }, [isOpen]);

  useEffect(() => {
    setOpen(false);
    if (onClose) onClose(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
        if (onClose) onClose(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onClose]);

  if (!mounted || typeof window === "undefined" || hiddenRoutes.has(location.pathname)) {
    return null;
  }

  const drawerClasses = `fixed top-0 left-0 z-50 flex h-screen w-72 max-w-[82%] flex-col p-4 pt-20 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${
    theme === "dark"
      ? "bg-zinc-950/96 text-white backdrop-blur-md"
      : "bg-white/95 text-zinc-900 backdrop-blur-md"
  } ${open ? "translate-x-0" : "-translate-x-full"}`;

  const brandSubClass = theme === "dark" ? "text-zinc-400" : "text-zinc-500";

  const handleToggleDrawer = () => {
    const next = !open;
    setOpen(next);
    if (onClose) onClose(next);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
    if (onClose) onClose(false);
  };

  const desktopTier =
    userLevel === "admin"
      ? "Admin"
      : userLevel === "elite"
      ? "Elite"
      : userLevel === "pro"
      ? "Pro"
      : "Basic";

  const Brand = (
    <div className="mb-6 flex cursor-pointer items-center gap-3" onClick={() => handleNavigate("/")}>
      <img src={logo} alt="Health's Spot logo" className="h-11 w-11 rounded-xl object-cover" />
      <div className="min-w-0">
        <div className="truncate text-lg font-black text-yellow-400">Health&apos;s Spot</div>
        <div className={`truncate text-xs ${brandSubClass}`}>Performance dashboard, χωρίς σαλάτες</div>
      </div>
    </div>
  );

  const ModuleList = (
    <div className="space-y-2">
      {visibleModules.map((item) => {
        const active = location.pathname === item.path;
        return (
          <NavButton
            key={item.name}
            item={item}
            active={active}
            onClick={() => handleNavigate(item.path)}
            theme={theme}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        className="fixed left-4 top-4 z-[60] rounded-xl bg-yellow-500 p-2.5 text-black shadow-md transition hover:bg-yellow-400 lg:hidden"
        onClick={handleToggleDrawer}
      >
        {open ? <HiX size={24} /> : <HiMenu size={24} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setOpen(false);
            if (onClose) onClose(false);
          }}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col overflow-y-auto border-r p-4 pt-6 shadow-2xl backdrop-blur-md lg:flex ${
          theme === "dark"
            ? "border-white/6 bg-zinc-950/96 text-white"
            : "border-zinc-200 bg-white/92 text-zinc-900"
        }`}
      >
        {Brand}

        <div
          className={`mb-4 rounded-2xl px-4 py-3 ${
            theme === "dark"
              ? "bg-black/30 ring-1 ring-white/8"
              : "bg-zinc-50 ring-1 ring-zinc-200"
          }`}
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Access</div>
          <div className="mt-1 text-sm font-bold">{isLoaded ? desktopTier : "Loading..."}</div>
        </div>

        {ModuleList}

        <button
          onClick={toggleTheme}
          className="mt-auto rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400"
        >
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </aside>

      <div className={drawerClasses}>
        {Brand}
        {ModuleList}

        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            theme === "dark"
              ? "bg-black/30 text-zinc-300 ring-1 ring-white/8"
              : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          Tier: <strong>{isLoaded ? desktopTier : "Loading..."}</strong>
        </div>

        <button
          onClick={toggleTheme}
          className="mt-auto rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400"
        >
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </>
  );
}
