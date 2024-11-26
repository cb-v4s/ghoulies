import { useIsAuthenticated } from "@hooks/useIsAuthenticated";
import { ProtectedSection } from "./Protected";

export const Friends = () => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) return <ProtectedSection />;

  return (
    <div className="flex flex-col items-center justify-center pt-12">
      <span className="text-slate-200">Coming soon.</span>
    </div>
  );
};
