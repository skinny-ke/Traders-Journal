import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import LoadingState from "../ui/LoadingState.jsx";

// Renders children only when the user is NOT authenticated.
// Authenticated users are redirected to /dashboard unless they are on an
// auth-recovery route (/forgot-password or /reset-password).
export default function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isRecoveryRoute = location.pathname === "/forgot-password" || location.pathname === "/reset-password";

  if (loading) {
    return <LoadingState message="Checking your session..." />;
  }

  if (isAuthenticated && !isRecoveryRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
