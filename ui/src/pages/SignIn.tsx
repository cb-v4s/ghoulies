import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "@validations/auth.schema";
import { ArrowRight, Eye, EyeOff } from "@lib/icons";
import { LoadingSpinner } from "@components/LoadingSpinner";
import {
  apiRoutes,
  ACCESS_TOKEN_IDENTIFIER_KEY,
  REFRESH_TOKEN_IDENTIFIER_KEY,
} from "@/siteConfig";
import { useApiRequest } from "@/lib/query";

export const SignIn = () => {
  const formDefaultValues = {
    email: "",
    password: "",
  };
  const [error, setError] = useState<string | null>(null);
  const {
    mutate: doSignin,
    error: doSigninError,
    data,
    isPending,
    isError,
  } = useApiRequest<any, any>("post", apiRoutes.login);

  const navigate = useNavigate();
  const [displayInputValue, setDisplayInputValue] = useState<boolean>(false);
  const form = useForm({
    defaultValues: formDefaultValues,
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = form.handleSubmit(async (data: any) => await doSignin(data));

  useEffect(() => {
    if (!data) return;

    localStorage.setItem(ACCESS_TOKEN_IDENTIFIER_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_IDENTIFIER_KEY, data.refreshToken);
    navigate("/");
  }, [data]);

  useEffect(() => {
    const data: any = doSigninError?.response?.data;
    if (!data) {
      setError("Something went wrong");
    } else {
      setError(data.error);
    }
  }, [doSigninError]);

  useEffect(() => {
    if (Object.keys(form.formState.errors).length) {
      console.log("signin form errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-md dark:bg-secondary">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          Welcome back.
        </h2>

        {isError && (
          <div className="my-4 rounded-md border border-red-300 bg-red-100 px-4 py-2 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <input
            className="mt-2 flex w-full items-center justify-center rounded-xl border-2 border-gray-100 bg-secondary px-4 py-2 text-muted-foreground outline-none focus-within:border-gray-200 focus-within:bg-white hover:border-gray-200 dark:border-secondary dark:bg-background dark:focus-within:bg-secondary"
            type="text"
            title="Email"
            placeholder="Email"
            id="username"
            {...form.register("email")}
          />

          {form.formState.errors["email"] && (
            <div className="mt-1 text-xs text-red-400">
              {form.formState.errors["email"]?.message?.toString()}
            </div>
          )}

          <div className="mt-2 flex w-full items-center justify-center rounded-xl border-2 border-gray-100 bg-secondary px-4 py-2 text-muted-foreground outline-none focus-within:border-gray-200 focus-within:bg-white hover:border-gray-200 dark:border-secondary dark:bg-background dark:focus-within:bg-secondary">
            <input
              type={displayInputValue ? "text" : "password"}
              spellCheck={false}
              className="w-full border-none bg-transparent outline-none"
              title="Password"
              placeholder="Your password"
              id="password"
              {...form.register("password")}
            />
            {displayInputValue ? (
              <Eye
                onClick={() => setDisplayInputValue(false)}
                className="ml-2 cursor-pointer"
                size={20}
              />
            ) : (
              <EyeOff
                onClick={() => setDisplayInputValue(true)}
                className="ml-2 cursor-pointer"
                size={20}
              />
            )}
          </div>

          {form.formState.errors["password"] && (
            <div className="mt-1 text-xs text-red-400">
              {form.formState.errors["password"]?.message?.toString()}
            </div>
          )}

          <button
            type="submit"
            className="bg-sky-400 hover:bg-sky-500 flex w-full items-center justify-center rounded-xl px-4 py-2 font-semibold text-white dark:bg-background dark:text-primary dark:hover:bg-card mt-4"
          >
            <span className="mr-2 text-lg font-semibold">Continue</span>
            {isPending ? <LoadingSpinner size={3} /> : <ArrowRight size={20} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don&apos;t have an account yet?
          <span className="ml-1 text-sky-400 underline">
            <a></a>
            <Link to="/signup">Sign up</Link>
          </span>
        </p>
      </div>
    </div>
  );
};
