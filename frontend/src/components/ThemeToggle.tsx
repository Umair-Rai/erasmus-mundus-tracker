import { useState } from "react";
import { applyTheme, currentTheme, type Theme } from "../theme";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;

  return (
    <button
      className="theme-toggle"
      title={label}
      aria-label={label}
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
