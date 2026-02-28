import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { JobProvider } from "./context/JobContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import ClientDashboard from "./pages/ClientDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <JobProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: "glass-card",
                style: {
                  background: "rgba(10, 10, 10, 0.9)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(20px)",
                },
                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "#fff",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/client/*"
                element={
                  <ProtectedRoute userType="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/worker/*"
                element={
                  <ProtectedRoute userType="worker">
                    <WorkerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </JobProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
