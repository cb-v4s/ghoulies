import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/validations/auth.schema";
import { useNavigate, Link } from "react-router-dom";
import { LoadingSpinner } from "@/components/icons/LoadingSpinner";
import { ArrowRight, Eye, EyeOff } from "@lib/icons";
import { useApiRequest } from "@/lib/query";
import { apiRoutes } from "@/siteConfig";
import { capitalize } from "@/lib/misc";

export const SignUp = () => {
  const [displayPassword, setDisplayPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [displayConfirmPassword, setDisplayConfirmPassword] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const {
    mutate: doSignup,
    isSuccess,
    error: doSignupError,
    isError,
    isPending,
  } = useApiRequest<any, any>("post", apiRoutes.signup);
  const signupDefaultValues = {
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  };
  const form = useForm({
    defaultValues: signupDefaultValues,
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = form.handleSubmit(async (data: any) => {
    const { email, username, password } = data;

    await doSignup({
      email,
      username,
      password,
    });
  });

  useEffect(() => {
    if (!isSuccess) return;

    navigate("/login");
  }, [isSuccess]);

  useEffect(() => {
    console.log("useEffect ~ data:", doSignupError);
    const data: any = doSignupError?.response?.data;

    if (!data) {
      setError("Something went wrong");
    } else {
      setError(data.error);
    }
  }, [doSignupError]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div id="console" className="w-full max-w-md px-6 py-8 relative">
        <h2 className="mb-6 text-center text-2xl font-semibold text-primary">
          Let&apos;s get started!
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
            id="email"
            {...form.register("email")}
          />

          {form.formState.errors["email"] && (
            <div className="mt-1 text-xs text-red-400">
              {form.formState.errors["email"]?.message?.toString()}
            </div>
          )}

          <input
            className="mt-2 flex w-full items-center justify-center border-2 border-primary bg-background px-4 py-2 text-primary placeholder-primary outline-none hover:border-gray-200"
            type="text"
            title="Username"
            placeholder="Username"
            id="username"
            {...form.register("username")}
          />

          {form.formState.errors["username"] && (
            <div className="mt-1 text-xs text-red-400">
              {form.formState.errors["username"]?.message?.toString()}
            </div>
          )}

          <div className="mt-2 flex w-full items-center justify-center border-2 border-primary bg-background px-4 py-2 text-primary placeholder-primary outline-none hover:border-gray-200">
            <input
              type={displayPassword ? "text" : "password"}
              spellCheck={false}
              className="w-full border-none bg-transparent outline-none"
              title="Password"
              placeholder="Password"
              id="password"
              {...form.register("password")}
            />
            {displayPassword ? (
              <Eye
                onClick={() => setDisplayPassword(false)}
                className="ml-2 cursor-pointer"
                size={20}
              />
            ) : (
              <EyeOff
                onClick={() => setDisplayPassword(true)}
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

          <div className="mt-2 flex w-full items-center justify-center border-2 border-primary bg-background px-4 py-2 text-primary placeholder-primary outline-none hover:border-gray-200">
            <input
              type={displayConfirmPassword ? "text" : "password"}
              spellCheck={false}
              className="w-full border-none bg-transparent outline-none"
              title="Confirm Password"
              placeholder="Confirm password"
              id="confirmPassword"
              {...form.register("confirmPassword")}
            />
            {displayConfirmPassword ? (
              <Eye
                onClick={() => setDisplayConfirmPassword(false)}
                className="ml-2 cursor-pointer"
                size={20}
              />
            ) : (
              <EyeOff
                onClick={() => setDisplayConfirmPassword(true)}
                className="ml-2 cursor-pointer"
                size={20}
              />
            )}
          </div>

          {form.formState.errors["confirmPassword"] && (
            <div className="mt-1 text-xs text-red-400">
              {form.formState.errors["confirmPassword"]?.message?.toString()}
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
          Already a member?
          <span className="ml-1 font-semibold underline">
            <Link to="/login">Log in</Link>
          </span>
        </p>
      </div>
    </div>
  );
};
