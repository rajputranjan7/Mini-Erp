import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: Role[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="font-display text-lg font-semibold text-ink">Access restricted</p>
        <p className="text-sm text-slate-500">Your role ({user.role}) doesn't have access to this page.</p>
      </div>
    );
  }

  return children;
}
