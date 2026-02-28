import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { TeamProvider } from "./context/TeamContext";
import { HackathonProvider } from "./context/HackathonContext";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HackathonProvider>
      <AuthProvider>
        <TeamProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </TeamProvider>
      </AuthProvider>
    </HackathonProvider>
  </StrictMode>,
);
