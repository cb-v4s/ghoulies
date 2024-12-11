import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "@validations/auth.schema";
import { ArrowRight, Eye, EyeOff } from "@lib/icons";
import { LoadingSpinner } from "@/components/icons/LoadingSpinner";
import { apiRoutes } from "@/siteConfig";
import { useApiRequest } from "@/lib/query";
import { capitalize } from "@/lib/misc";

export const SignIn = () => {
  const formDefaultValues = {
    email: "",
    password: "",
  };
  const [error, setError] = useState<string | null>(null);
  const {
    mutate: doSignin,
    error: doSigninError,
    isSuccess,
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
    if (!isSuccess) return;

    navigate("/");
  }, [isSuccess]);

  useEffect(() => {
    const data: any = doSigninError?.response?.data;
    if (!data) {
      setError("Something went wrong");
    } else {
      setError(data.error);
    }
  }, [doSigninError]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div id="console" className="w-full max-w-md px-6 py-8 relative">
        <h2 className="mb-6 text-center text-2xl font-semibold text-primary">
          Welcome back.
        </h2>

        {isError && (
          <div className="my-4 py-2 text-red-500">
            {capitalize(error ?? "")}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <input
            className="mt-2 flex w-full items-center justify-center border-2 border-primary bg-background px-4 py-2 text-primary placeholder-primary outline-none hover:border-gray-200"
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

          <div className="mt-2 flex w-full items-center justify-center border-2 border-primary bg-background px-4 py-2 text-primary placeholder-primary outline-none hover:border-gray-200">
            <input
              type={displayInputValue ? "text" : "password"}
              spellCheck={false}
              className="w-full border-none bg-transparent outline-none "
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
            disabled={isPending}
            className="flex w-full items-center justify-center px-4 py-2 font-semibold text-primary mt-4 bg-background border-2 border-primary"
          >
            <span className="mr-2 text-lg font-semibold">Continue</span>
            {isPending ? <LoadingSpinner size={3} /> : <ArrowRight size={20} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-primary">
          Don&apos;t have an account yet?
          <span className="ml-1 underline font-semibold">
            <a></a>
            <Link to="/signup">Sign up</Link>
          </span>
        </p>
      </div>
    </div>
  );
};
