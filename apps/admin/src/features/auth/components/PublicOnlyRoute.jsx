import { Navigate, Outlet, useLocation } from "react-router-dom";

import { adminPaths, adminRouteList } from "../../../app/routePaths.js";
import { useAuth } from "../hooks/useAuth.js";
import { AuthStatusPage } from "./AuthStatusPage.jsx";

/** Accepts only same-origin relative return paths after authentication. */
function safeReturnPath(candidate) {
  return adminRouteList.includes(candidate) && candidate !== adminPaths.login
    ? candidate
    : adminPaths.dashboard;
}

/** Keeps authenticated administrators out of public-only routes such as login. */
export function PublicOnlyRoute() {
  const location = useLocation();
  const { status, error, retry, signOut } = useAuth();

  if (["initializing", "checking_authorization"].includes(status)) {
    return <AuthStatusPage type="loading" message="Checking for an existing Nuede admin session." />;
  }

  if (status === "authorized") {
    return <Navigate replace to={safeReturnPath(location.state?.from)} />;
  }

  if (status === "unauthorized") {
    return <AuthStatusPage type="unauthorized" message="This authenticated account has no Nuede administrator authorization." actionLabel="Sign out" onAction={signOut} />;
  }

  if (status === "inactive") {
    return <AuthStatusPage type="inactive" message="This administrator account has been deactivated." actionLabel="Sign out" onAction={signOut} />;
  }

  if (status === "error") {
    return <AuthStatusPage type="error" message={error} actionLabel="Try again" onAction={retry} />;
  }

  return <Outlet />;
}
