import Chat from "./chat";

export const Controls = () => {
  return (
    <div className="w-full h-16 bg-transparent flex justify-center py-2 px-4">
      <Chat />
      <button className="ml-4 rounded-md flex items-center justify-center bg-transparent h-12">
        <img
          className="m-auto select-none overflow-hidden w-12 h-12"
          src="/console.png"
          alt="console"
        />
      </button>
    </div>
  );
};
