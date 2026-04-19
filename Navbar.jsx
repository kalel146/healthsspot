import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useUser } from "@clerk/clerk-react";
import logo from "./assets/logo.png";
import { HiMenu, HiX } from "react-icons/hi";
import { getAccessBadgeText, getDisplayLevel, resolveUserAccess } from "./utils/accessControl";

const modules = [
  { icon: "🔥", name: "FIT MENU", path: "/dashboard", minLevel: "basic" },
  { icon: "📚", name: "Training", path: "/programs", minLevel: "basic" },
  { icon: "🏋️", name: "Power", path: "/training", minLevel: "basic" },
  { icon: "🏊", name: "Cardio", path: "/cardio", minLevel: "basic" },
  { icon: "🍎", name: "Nutrition", path: "/nutrition", minLevel: "basic" },
  { icon: "🥂", name: "Recovery", path: "/recovery", minLevel: "basic" },
  { icon: "💳", name: "Plans", path: "/pricing", minLevel: "basic" },
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

  const access = useMemo(() => resolveUserAccess(user), [user]);
  const userLevel = access.appLevel;

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
    onClose?.(false);
  }, [location.pathname, onClose]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
        onClose?.(false);
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
    onClose?.(next);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
    onClose?.(false);
  };

  const desktopTier = getDisplayLevel(userLevel, { isLifetimeFree: access.isLifetimeFree });
  const accessBadgeText = getAccessBadgeText(access);
  const showUpgradeCard = !access.isAdmin && !access.isLifetimeFree;

  const Brand = (
    <div className="mb-6 flex cursor-pointer items-center gap-3" onClick={() => handleNavigate("/")}>
      <img src={logo} alt="Health's Spot logo" className="h-11 w-11 rounded-xl object-cover" />
      <div className="min-w-0">
        <div className="truncate text-lg font-black text-yellow-400">Health&apos;s Spot</div>
        <div className={`truncate text-xs ${brandSubClass}`}>
          {access.isLocalOwnerPreview
            ? "Local owner preview active"
            : access.isLifetimeFree
            ? "Gifted lifetime access active"
            : "Structured performance system"}
        </div>
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

  const UpgradeCard = showUpgradeCard ? (
    <div
      className={`mt-4 rounded-2xl px-4 py-4 text-sm ${
        theme === "dark"
          ? "bg-gradient-to-br from-yellow-500/12 to-orange-500/8 text-zinc-200 ring-1 ring-yellow-500/20"
          : "bg-gradient-to-br from-yellow-50 to-orange-50 text-zinc-700 ring-1 ring-yellow-200"
      }`}
    >
      <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">Upgrade path</div>
      <div className="mt-2 text-sm font-semibold">Θες περισσότερα modules, καλύτερο export και premium access;</div>
      <button
        onClick={() => handleNavigate("/pricing")}
        className="mt-3 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400"
      >
        View Plans
      </button>
    </div>
  ) : null;

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
            onClose?.(false);
          }}
        />
      )}

      <aside
        className={`hidden h-screen w-64 shrink-0 flex-col border-r p-4 lg:fixed lg:left-0 lg:top-0 lg:flex ${
          theme === "dark"
            ? "border-white/6 bg-zinc-950/92 text-white"
            : "border-zinc-200 bg-white/92 text-zinc-900"
        }`}
      >
        {Brand}

        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
            theme === "dark"
              ? "bg-black/30 text-zinc-300 ring-1 ring-white/8"
              : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Access</div>
          <div className="mt-1 text-sm font-bold">{isLoaded ? desktopTier : "Loading..."}</div>
          <div className="mt-1 text-[11px] opacity-70">{accessBadgeText}</div>
        </div>

        {ModuleList}
        {UpgradeCard}

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
        {UpgradeCard}

        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            theme === "dark"
              ? "bg-black/30 text-zinc-300 ring-1 ring-white/8"
              : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          Tier: <strong>{isLoaded ? desktopTier : "Loading..."}</strong>
          <div className="mt-1 text-[11px] opacity-70">{accessBadgeText}</div>
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
