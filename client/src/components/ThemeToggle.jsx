import { useTheme } from "../context/ThemeContext";
import Icon from "./Icon";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} size={20} />
    </button>
  );
}
