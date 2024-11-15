import { Accordeon } from "../../Accordeon";
import { useIsAuthenticated } from "../../../hooks/useIsAuthenticated";
import { ProtectedSection } from "./Protected";
import { SquareArrowOutUpRight } from "../../../lib/icons";

export const RoomStudio = () => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) return <ProtectedSection />;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("data from new room form =>", e.target);
  };

  const NewRoom = () => {
    // TODO: reuse input for the form as a component
    return (
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="flex flex-row mt-2">
            <label
              className="w-[30%] pr-4 py-2 text-left text-slate-200"
              htmlFor="roomName"
            >
              Title
            </label>

            <input
              className="w-[70%] rounded-sm border-2 border-slate-800 outline-none focus:outline-none bg-transparent text-slate-200 px-4 py-2"
              name="roomName"
              placeholder="Add a title"
              type="text"
            />
          </div>
          <div className="flex flex-row">
            <label
              className="w-[30%] pr-4 py-2 text-left text-slate-200"
              htmlFor="roomName"
            >
              Description
            </label>
            <input
              className="w-[70%] rounded-sm border-2 border-slate-800 outline-none focus:outline-none bg-transparent text-slate-200 px-4 py-2"
              name="roomDescription"
              placeholder="Add a description (optional)"
              type="text"
            />
          </div>
          <div className="pt-2 pb-4 flex flex-row items-center justify-center border-t-2 border-slate-800">
            <div className="text-sm text-slate-300">
              <span>Learn about </span>
              <span className="border-b border-blue-500">
                <a className="text-blue-500 inline-block select-none">
                  Conduct guidelines
                  <SquareArrowOutUpRight className="inline-block w-4 h-4 ml-1 mt-[-3px]" />
                </a>
              </span>
            </div>
            <button
              className="bg-slate-800 text-slate-200 px-4 py-1 block ml-auto outline-none focus:outline-none"
              type="submit"
            >
              Join room
            </button>
          </div>
        </div>
        {/* <input
          name="password"
          placeholder="Password (optional)"
          type="password"
        /> */}
      </form>
    );
  };

  const sections = [
    {
      title: "New room",
      content: () => <NewRoom />,
    },
    {
      title: "My rooms",
      content: () => (
        <>
          <p className="text-slate-200">Looks like there is nothing yet.</p>
        </>
      ),
    },
  ];

  return <Accordeon sections={sections} />;
};
