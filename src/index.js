import React from "react";
import ReactDOM from "react-dom/client";
import "./assets/styles/global.scss";
import {UniversalDm} from "./components/index.js";

const sampleAddress = '0x11B002247efc78A149F4e6aDc9F143b47bE9123D'
const sampleDisplayName = 'Poapdispenser.eth'
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UniversalDm
      address={sampleAddress}
      displayName={sampleDisplayName}
    />
  </React.StrictMode>
);