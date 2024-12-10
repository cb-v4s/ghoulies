import { useApiRequest, useFetch } from "@/lib/query";
import { UserProfileResponse } from "@/types";
import { apiRoutes } from "@/siteConfig";
import moment from "moment";
import { useEffect, useState } from "react";
import { ArrowRight } from "@/lib/icons";
import { LoadingSpinner } from "@/components/icons/LoadingSpinner";
import { useSelector } from "react-redux";
import { getUsername } from "@/state/room.reducer";
import { capitalize } from "@/lib/misc";

type UpdateUser = {
  username: string;
};

export const Account = () => {
  const defaultUpdateUser = {
    username: "",
  };
  const [updateUser, setUpdateUser] = useState<UpdateUser>(defaultUpdateUser);
  const [error, setError] = useState<string | null>(null);

  const {
    data: userProfile,
    isSuccess: fetchedUserProfile,
    isLoading: getUserProfileLoading,
    error: getUserProfileError,
  } = useFetch<UserProfileResponse>(apiRoutes.profile);

  useEffect(() => {
    if (!userProfile?.user.username) return;

    setUpdateUser({
      username: userProfile?.user.username,
    });
  }, [userProfile?.user.username]);

  const {
    mutate: updateUserProfile,
    isPending,
    isSuccess,
    isError,
    error: updateError,
  } = useApiRequest<any, any>("post", apiRoutes.updateUser);

  const hdlUpdateUser = async (e: any) => {
    e.preventDefault();

    const username = userProfile?.user.username;
    if (!updateUser?.username.length || username === updateUser.username)
      return;

    await updateUserProfile(updateUser);
  };

  const hdlUpdateUserValues = (e: any) => {
    setUpdateUser({
      ...updateUser,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const data: any = updateError?.response?.data;
    if (!data) {
      setError("Something went wrong");
    } else {
      setError(data.error);
    }
  }, [updateError]);

  return (
    <div className="flex flex-col pt-4 px-4 text-primary">
      <div className="flex mb-4">
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
              {isError && (
                <div className="mb-2 text-red-500 text-sm">
                  {capitalize(error ?? "")}
                </div>
              )}

              <form onSubmit={hdlUpdateUser}>
                <label
                  className="w-[30%] pr-4 py-1 text-left text-primary"
                  htmlFor="username"
                >
                  Username
                </label>

                <input
                  name="username"
                  value={updateUser.username}
                  onChange={hdlUpdateUserValues}
                  className="w-full rounded-sm border-2 border-primary outline-none focus:outline-none bg-transparent text-primary px-4 py-1 mt-1"
                  type="text"
                  placeholder="Change your username"
                />

                <button
                  className="text-primary px-4 py-1 outline-none focus:outline-none border-2 border-primary flex items-center justify-center mt-3"
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
      <div className="border-t-2 border-primary text-primary flex flex-col p-4">
        <span className="underline">0 New Message(s)</span>
        <span className="underline">0 Friend Request(s)</span>
      </div>
    </div>
  );
};
