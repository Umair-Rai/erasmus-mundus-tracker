export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const BROWSER_CHROME: Record<Theme, string> = { light: "#e5e4e2", dark: "#171310" };

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BROWSER_CHROME[theme]);
  if (!persist) return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this visit only.
  }
}
