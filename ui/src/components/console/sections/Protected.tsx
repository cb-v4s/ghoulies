export const ProtectedSection = () => {
  return (
    <div className="flex flex-col items-center justify-center pt-12">
      <img className="h-16 w-20 select-none" src="/error.png" alt="error" />
      <div className="px-6 pt-4 text-center">
        <p className="text-primary">This is an exclusive section for users.</p>
        <p className="text-primary mt-1">
          <a className="text-primary" href="/login">
            Login
          </a>{" "}
          or{" "}
          <a className="text-primary" href="/signup">
            create an account
          </a>
        </p>
      </div>
    </div>
  );
};
