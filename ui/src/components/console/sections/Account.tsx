import { useIsAuthenticated } from "@hooks/useIsAuthenticated";
import { ProtectedSection } from "./Protected";
import { useSelector } from "react-redux";
import { getUsername } from "@/state/room.reducer";

export const Account = () => {
  const isAuthenticated = useIsAuthenticated();
  const username = useSelector(getUsername);

  if (!isAuthenticated) return <ProtectedSection />;

  return (
    <div className="flex flex-col pt-4 px-4 text-slate-200">
      <div className="flex">
        <div className="flex flex-col items-center justify-center w-[40%] mb-4">
          <span className="mb-[-20px]">{username}</span>
          <img
            className="w-30 h-24"
            src="/sprites/ghost/frontLeft.png"
            alt="user"
          />
          <span className="mt-[-10px] text-xs">Member since oct, 8</span>
        </div>
        <div className="w-[60%]">
          <input
            className="w-full"
            type="text"
            placeholder="Change your username"
          />
          <input
            className="w-full"
            type="text"
            placeholder="Change your state"
          />
        </div>
      </div>
      <div className="border-t-2 border-slate-200 flex flex-col p-4">
        <span className="underline">0 New Message(s)</span>
        <span className="underline">0 Friend Request(s)</span>
      </div>
    </div>
  );
};
