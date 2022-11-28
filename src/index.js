import React from "react";
import ReactDOM from "react-dom/client";
import {UniversalDm} from "./components/index.js";

// Params
// sampleAddress is the user we're messaging 
// const sampleAddress = '0x11B002247efc78A149F4e6aDc9F143b47bE9123D'
const sampleAddress = '0x57632Ba9A844af0AB7d5cdf98b0056c8d87e3A85'
// optional param
// const sampleDisplayName = 'Poapdispenser.eth'

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <div style={{padding: 300}}>
    <UniversalDm
      address={sampleAddress}
      theme='light'
      popoverDirection='top'
    />
    </div>
  </React.StrictMode>
);