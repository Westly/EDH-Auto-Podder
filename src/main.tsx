import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StateProvider } from "./state/StateProvider";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StateProvider>
        <App />
      </StateProvider>
    </BrowserRouter>
  </React.StrictMode>
);
