import { useIsAuthenticated } from "../../../hooks/useIsAuthenticated";
import { ProtectedSection } from "./Protected";

export const Friends = () => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) return <ProtectedSection />;

  return (
    <div className="flex flex-col items-center justify-center pt-12">
      <p className="text-blue-500">Friends</p>
    </div>
  );
};
