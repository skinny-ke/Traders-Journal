import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TradesProvider } from "./context/TradesContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import TradeHistoryPage from "./pages/TradeHistoryPage";
import AddTradePage from "./pages/AddTradePage";
import TradeDetailsPage from "./pages/TradeDetailsPage";
import EditTradePage from "./pages/EditTradePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import SettingsPage from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <TradesProvider>
        <AuthProvider>
          <Routes>
            {/* Public authentication routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

            {/* Protected application routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/trades" element={<TradeHistoryPage />} />
              <Route path="/trades/:id" element={<TradeDetailsPage />} />
              <Route path="/trades/:id/edit" element={<EditTradePage />} />
              <Route path="/add-trade" element={<AddTradePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </TradesProvider>
    </BrowserRouter>
  );
}

export default App;
