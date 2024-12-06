import { useApiRequest, useFetch } from "@/lib/query";
import { UserProfileResponse } from "@/types";
import { apiRoutes } from "@/siteConfig";
import moment from "moment";
import { useState } from "react";
import { ArrowRight } from "@/lib/icons";
import { LoadingSpinner } from "@/components/icons/LoadingSpinner";

type UpdateUser = {
  username: string;
};

const defaultUpdateUser = {
  username: "",
};

export const Account = () => {
  const [updateUser, setUpdateUser] = useState<UpdateUser>(defaultUpdateUser);

  const {
    data: userProfile,
    isSuccess: fetchedUserProfile,
    isLoading: getUserProfileLoading,
    error: getUserProfileError,
  } = useFetch<UserProfileResponse>(apiRoutes.profile);

  const {
    mutate: updateUserProfile,
    isPending,
    isSuccess,
    isError,
    error,
  } = useApiRequest<any, any>("post", apiRoutes.updateUser);

  const hdlUpdateUser = async (e: any) => {
    e.preventDefault();

    await updateUserProfile(updateUser);
  };

  const hdlUpdateUserValues = (e: any) => {
    setUpdateUser({
      ...updateUser,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex flex-col pt-4 px-4 text-slate-200">
      <div className="flex">
        {userProfile && (
          <>
            <div className="flex flex-col items-center justify-center w-[50%] mb-4">
              <span className="mb-[-20px]">{userProfile.user.username}</span>
              <img
                className="w-30 h-24"
                src="/sprites/ghost/frontLeft.png"
                alt="user"
              />
              <span className="mt-[-10px] text-xs">
                Member since{" "}
                {moment.unix(userProfile.user.createdAt).format("MMM D, YYYY")}
              </span>
            </div>

            <div className="w-[50%]">
              <form onSubmit={hdlUpdateUser}>
                <label
                  className="w-[30%] pr-4 py-1 text-left text-slate-200"
                  htmlFor="username"
                >
                  Username
                </label>

                <input
                  name="username"
                  value={updateUser.username}
                  onChange={hdlUpdateUserValues}
                  className="w-full rounded-sm border-2 border-sky-900 outline-none focus:outline-none bg-transparent text-slate-200 px-4 py-1 mt-1"
                  type="text"
                  placeholder="Change your username"
                />

                <button
                  className="text-slate-200 px-4 py-1 outline-none focus:outline-none border-2 border-sky-800 flex items-center justify-center mt-3"
                  type="submit"
                >
                  <span className="mr-2">Update</span>
                  {isPending ? (
                    <LoadingSpinner size={3} />
                  ) : (
                    <ArrowRight className="mt-.5" size={18} />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
      <div className="border-t-2 border-slate-200 flex flex-col p-4">
        <span className="underline">0 New Message(s)</span>
        <span className="underline">0 Friend Request(s)</span>
      </div>
    </div>
  );
};
