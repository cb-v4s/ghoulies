import { Fragment } from "react/jsx-runtime";
import { Room } from "../components/room/Room.tsx";
import { Controls } from "../components/Controls.tsx";

const Lobby = () => {
  return (
    <Fragment>
      <Room />
      <Controls />
    </Fragment>
  );
};

export default Lobby;
