import { Navigate, Outlet, useLocation } from "react-router-dom";

import { adminPaths } from "../../../app/routePaths.js";
import { useAuth } from "../hooks/useAuth.js";
import { AuthStatusPage } from "./AuthStatusPage.jsx";

export function ProtectedRoute() {
  const location = useLocation();
  const { status, error, retry, signOut } = useAuth();

  if (["initializing", "checking_authorization"].includes(status)) {
    return <AuthStatusPage type="loading" message="Confirming the current session and Nuede administrator record." />;
  }

  if (status === "signed_out") {
    return <Navigate replace to={adminPaths.login} state={{ from: location.pathname }} />;
  }

  if (status === "unauthorized") {
    return <AuthStatusPage type="unauthorized" message="A Supabase account alone does not grant access. Ask an owner to authorize this account." actionLabel="Sign out" onAction={signOut} />;
  }

  if (status === "inactive") {
    return <AuthStatusPage type="inactive" message="Your identity is valid, but its Nuede administrator record is inactive." actionLabel="Sign out" onAction={signOut} />;
  }

  if (status === "error") {
    return <AuthStatusPage type="error" message={error} actionLabel="Try again" onAction={retry} />;
  }

  return <Outlet />;
}
