import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Relative base lets the static build work under any GitHub Pages sub-path.
  base: mode === "static" ? "./" : "/",
  server: {
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
}));
