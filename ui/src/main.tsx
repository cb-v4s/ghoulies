import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { store } from "./store";
import { Provider } from "react-redux";
import { Footer } from "./components/Footer.tsx";
import { WsHandler } from "./components/wsHandler.ts";

createRoot(document.getElementById("root")!).render(
  <>
    <Provider store={store}>
      <WsHandler />
      <App />
      <Footer />
    </Provider>
  </>
);
