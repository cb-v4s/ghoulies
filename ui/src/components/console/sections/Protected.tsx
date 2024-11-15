export const ProtectedSection = () => {
  return (
    <div className="flex flex-col items-center justify-center pt-12">
      <img className="h-16 w-20 select-none" src="/error.png" alt="error" />
      <div className="px-6 pt-4 text-center">
        <p className="text-slate-200">
          This is an exclusive section for users.
        </p>
        <p className="text-slate-200 mt-1">
          <a className="text-sky-400" href="/login">
            Login
          </a>{" "}
          or{" "}
          <a className="text-sky-400" href="/signup">
            create an account
          </a>
        </p>
      </div>
    </div>
  );
};
