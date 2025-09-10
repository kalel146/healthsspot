import React, { useState } from "react";
import { useTheme } from "./ThemeContext";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
}) {
  const { theme } = useTheme();
  const panel =
    theme === "dark"
      ? "bg-zinc-900/95 border border-zinc-800 text-zinc-100"
      : "bg-white/95 border border-zinc-200 text-zinc-900";

  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`rounded-2xl shadow-sm ${panel} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xl">{open ? "▾" : "▸"}</span>
      </button>

      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}
