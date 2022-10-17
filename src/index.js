import React from "react";
import ReactDOM from "react-dom/client";
import {UniversalDm} from "./components/index.js";

// Params
// sampleAddress is the user we're messaging 
// const sampleAddress = '0x11B002247efc78A149F4e6aDc9F143b47bE9123D'
const sampleAddress = '0x6c99d344750c481A2788EBd9F9FC467C814CF46e'
// optional param
const sampleDisplayName = 'Poapdispenser.eth'

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <div style={{padding: 300}}>
    <UniversalDm
      address={sampleAddress}
      theme='dark'
      displayName={sampleDisplayName}
      popoverDirection='top'
    />
    </div>
  </React.StrictMode>
);