import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../lib/roles";
import { PageLoader } from "./ui";

// <Route element={<ProtectedRoute roles={["supplier"]} />}> ... </Route>
// - guests go to /login and come back here afterwards
// - logged-in users with the wrong account type go to their own dashboard
export default function ProtectedRoute({ roles = [] }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (user.role === "user" && location.pathname !== "/choose-account") {
    // Google sign-up that hasn't picked buyer/supplier yet
    return <Navigate to="/choose-account" replace state={{ from: location.pathname }} />;
  }
  if (roles.length && !roles.includes(user.role)) {
    if (checking) return <PageLoader />;
    return <Navigate to={homeFor(user)} replace state={{ denied: location.pathname }} />;
  }
  return <Outlet />;
}
