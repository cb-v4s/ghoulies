import { useIsAuthenticated } from "@hooks/useIsAuthenticated";
import { ProtectedSection } from "./Protected";

export const Account = () => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) return <ProtectedSection />;

  return (
    <div className="flex flex-col pt-4 px-4 text-slate-200">
      <div className="p-4">
        <img
          className="w-30 h-24"
          src="/sprites/ghost/frontLeft.png"
          alt="user"
        />
      </div>
      <div className="border-t-2 border-slate-200 flex flex-col p-4">
        <span className="underline">0 New Message(s)</span>
        <span className="underline">0 Friend Request(s)</span>
      </div>
    </div>
  );
};
