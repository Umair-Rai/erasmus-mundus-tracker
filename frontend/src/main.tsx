import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./auth";
import { applyTheme, currentTheme } from "./theme";
import { WishlistProvider } from "./wishlist";
import "./styles.css";

applyTheme(currentTheme(), false);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <WishlistProvider>
        <App />
      </WishlistProvider>
    </AuthProvider>
  </StrictMode>,
);
