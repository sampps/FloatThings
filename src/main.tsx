import React from "react";
import ReactDOM from "react-dom/client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import App from "./App";
import "./styles/globals.css";

gsap.registerPlugin(useGSAP);

// Project-wide defaults
gsap.defaults({
  overwrite: "auto",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
