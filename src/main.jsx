import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { registerSW } from "./hooks/usePWA.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);

registerSW();
