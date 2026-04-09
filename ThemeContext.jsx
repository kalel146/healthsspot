
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(undefined);

const STORAGE_KEY = "theme";

const getPreferredTheme = () => {
  if (typeof window === "undefined") return "dark";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch (error) {
    console.warn("Theme localStorage read failed:", error);
  }

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch (error) {
    return "dark";
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => getPreferredTheme());

  const setTheme = useCallback((value) => {
    setThemeState((prev) => {
      if (value !== "dark" && value !== "light") return prev;
      return value;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Theme localStorage write failed:", error);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === "dark" || event.newValue === "light") {
        setThemeState(event.newValue);
      }
    };

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleSystemChange = (event) => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") return;
      } catch {}

      setThemeState(event.matches ? "dark" : "light");
    };

    window.addEventListener("storage", handleStorage);

    if (media?.addEventListener) {
      media.addEventListener("change", handleSystemChange);
    } else if (media?.addListener) {
      media.addListener(handleSystemChange);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);

      if (media?.removeEventListener) {
        media.removeEventListener("change", handleSystemChange);
      } else if (media?.removeListener) {
        media.removeListener(handleSystemChange);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};

export default ThemeContext;
