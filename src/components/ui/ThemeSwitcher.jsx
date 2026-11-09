import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-lg border border-tj-medium bg-tj-card text-tj-primary hover:bg-tj-surface transition-colors duration-fast"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <Sun size={18} className="text-tj-accent" />
          <span className="sr-only">Light mode</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-tj-muted" />
          <span className="sr-only">Dark mode</span>
        </>
      )}
    </button>
  );
}
