import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";

export const ProtectedRoute = ({ children }: { children: any }) => {
  const isAuthorized = useIsAuthenticated();

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
};
