import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// state management
import { store } from "./store";
import { Provider } from "react-redux";
import IsoWorld from "./pages/IsoWorld.tsx";
import { Nana } from "./components/nana.tsx";

// import SocketHandler from "./components/wsHandler.ts";

createRoot(document.getElementById("root")!).render(
  <>
    {/* <Provider store={store}> */}
    {/* <SocketHandler /> */}
    {/* <App /> */}
    {<Nana />}
    {/* </Provider> */}
  </>
);
