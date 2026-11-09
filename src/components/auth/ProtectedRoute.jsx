import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import LoadingState from "../ui/LoadingState.jsx";

// Renders children only when the user is authenticated.
// Unauthenticated visitors are redirected to /login with the current
// location preserved so they can return after signing in.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
